import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@libs/prisma';
import { RedisService } from '@libs/redis';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  ProductQueryDto,
  CreateVariantDto,
} from './dto/catalog.dto';
import { paginatedResult } from '@libs/common';

const CATALOG_CACHE_TTL = 15 * 60; // 15 minutos

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ─── Categorías ──────────────────────────────────────────────────────────────

  async getCategories() {
    const cacheKey = 'catalog:categories';
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const categories = await this.prisma.category.findMany({
      where: { parentId: null },
      include: { children: true },
      orderBy: { name: 'asc' },
    });

    await this.redis.setJson(cacheKey, categories, CATALOG_CACHE_TTL);
    return categories;
  }

  async getFeaturedCategories() {
    return this.prisma.category.findMany({
      where: { isFeatured: true },
      orderBy: { featuredPosition: 'asc' },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) throw new ConflictException('Ya existe una categoría con ese slug');

    const category = await this.prisma.category.create({ data: dto });
    await this.redis.del('catalog:categories');
    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.update({
      where: { id },
      data: dto,
    });
    await this.redis.del('catalog:categories');
    return category;
  }

  async deleteCategory(id: string) {
    await this.prisma.category.delete({ where: { id } });
    await this.redis.del('catalog:categories');
    return { message: 'Categoría eliminada' };
  }

  // ─── Productos ────────────────────────────────────────────────────────────────

  async getProducts(query: ProductQueryDto) {
    const { page = 1, limit = 20, search, categoryId, categorySlug, minPrice, maxPrice } = query;
    const skip = (page - 1) * limit;

    const where: any = query.includeInactive ? {} : { isActive: true };

    if (query.featured) where.isFeatured = true;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      // Incluir productos de subcategorías también
      const children = await this.prisma.category.findMany({
        where: { parentId: categoryId },
        select: { id: true },
      });
      const ids = [categoryId, ...children.map((c) => c.id)];
      where.categoryId = { in: ids };
    } else if (categorySlug) {
      const cat = await this.prisma.category.findUnique({ where: { slug: categorySlug } });
      if (cat) {
        const children = await this.prisma.category.findMany({
          where: { parentId: cat.id },
          select: { id: true },
        });
        const ids = [cat.id, ...children.map((c) => c.id)];
        where.categoryId = { in: ids };
      }
    }

    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) where.basePrice.gte = minPrice;
      if (maxPrice) where.basePrice.lte = maxPrice;
    }

    if (query.onSale) {
      const now = new Date();
      const activeWhere = {
        isActive: true,
        validFrom: { lte: now },
        OR: [{ validUntil: null }, { validUntil: { gte: now } }],
      };
      const [ppRows, cpRows] = await Promise.all([
        this.prisma.promotionProduct.findMany({
          where: { promotion: activeWhere },
          select: { productId: true },
        }),
        this.prisma.promotionCategory.findMany({
          where: { promotion: activeWhere },
          select: { categoryId: true },
        }),
      ]);
      const onSaleIds = new Set<string>(ppRows.map((r) => r.productId));
      if (cpRows.length) {
        const catProductIds = await this.prisma.product.findMany({
          where: { categoryId: { in: cpRows.map((r) => r.categoryId) }, isActive: true },
          select: { id: true },
        });
        catProductIds.forEach((p) => onSaleIds.add(p.id));
      }
      where.id = { in: [...onSaleIds] };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { position: 'asc' } },
          variants: { select: { id: true, sku: true, price: true, stock: true, attributes: true } },
        },
        orderBy: query.sortBy === 'price_asc'
          ? { basePrice: 'asc' }
          : query.sortBy === 'price_desc'
            ? { basePrice: 'desc' }
            : { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    const promoMap = await this.computeActivePromotionsMap(
      products.map((p) => ({ id: p.id, categoryId: p.categoryId })),
    );
    const result = paginatedResult(products, total, page, limit);
    return {
      ...result,
      data: result.data.map((p) => ({
        ...p,
        activePromotion: promoMap.get(p.id) ?? null,
      })),
    };
  }

  async getProductBySlug(slug: string) {
    const cacheKey = `catalog:product:${slug}`;
    const cached = await this.redis.getJson<any>(cacheKey);

    let product: any;
    if (cached) {
      product = cached;
    } else {
      product = await this.prisma.product.findUnique({
        where: { slug, isActive: true },
        include: {
          category: true,
          images: { orderBy: { position: 'asc' } },
          variants: true,
        },
      });
      if (!product) throw new NotFoundException('Producto no encontrado');
      await this.redis.setJson(cacheKey, product, CATALOG_CACHE_TTL);
    }

    // activePromotion siempre fresco (no cacheado)
    const promoMap = await this.computeActivePromotionsMap([
      { id: product.id, categoryId: product.categoryId },
    ]);
    return { ...product, activePromotion: promoMap.get(product.id) ?? null };
  }

  async getProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        variants: true,
      },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  // ── Helpers internos ─────────────────────────────────────────────────────────

  private async computeActivePromotionsMap(
    products: Array<{ id: string; categoryId: string | null }>,
  ): Promise<Map<string, { name: string; discountType: string; discountValue: number }>> {
    if (!products.length) return new Map();
    const now = new Date();
    const productIds = products.map((p) => p.id);
    const categoryIds = [
      ...new Set(products.map((p) => p.categoryId).filter(Boolean)),
    ] as string[];

    const activeWhere = {
      isActive: true,
      validFrom: { lte: now },
      OR: [{ validUntil: null }, { validUntil: { gte: now } }],
    };

    const [productPromos, categoryPromos] = await Promise.all([
      this.prisma.promotionProduct.findMany({
        where: { productId: { in: productIds }, promotion: activeWhere },
        include: {
          promotion: {
            select: { name: true, discountType: true, discountValue: true, priority: true },
          },
        },
      }),
      categoryIds.length
        ? this.prisma.promotionCategory.findMany({
            where: { categoryId: { in: categoryIds }, promotion: activeWhere },
            include: {
              promotion: {
                select: { name: true, discountType: true, discountValue: true, priority: true },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    const result = new Map<string, { name: string; discountType: string; discountValue: number }>();

    for (const product of products) {
      const candidates = [
        ...productPromos.filter((pp) => pp.productId === product.id).map((pp) => pp.promotion),
        ...(product.categoryId
          ? categoryPromos
              .filter((cp) => cp.categoryId === product.categoryId)
              .map((cp) => cp.promotion)
          : []),
      ];
      if (!candidates.length) continue;

      const best = candidates.reduce((a, b) =>
        Number(b.discountValue) > Number(a.discountValue) ||
        (Number(b.discountValue) === Number(a.discountValue) && b.priority > a.priority)
          ? b
          : a,
      );
      result.set(product.id, {
        name: best.name,
        discountType: best.discountType as string,
        discountValue: Number(best.discountValue),
      });
    }

    return result;
  }

  private async generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const found = await this.prisma.product.findUnique({ where: { slug } });
      if (!found || found.id === excludeId) return slug;
      counter++;
      slug = `${baseSlug}-${counter}`;
    }
  }

  async createProduct(dto: CreateProductDto) {
    const uniqueSlug = await this.generateUniqueSlug(dto.slug);

    const { variants, ...productData } = dto;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        slug: uniqueSlug,
        basePrice: productData.basePrice,
        variants: variants?.length
          ? { create: variants }
          : undefined,
      },
      include: { variants: true, category: true },
    });

    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    await this.getProductById(id);

    const product = await this.prisma.product.update({
      where: { id },
      data: dto,
      include: { variants: true, category: true, images: true },
    });

    // Invalidar caché
    await this.redis.del(`catalog:product:${product.slug}`);
    return product;
  }

  async deleteProduct(id: string) {
    const product = await this.getProductById(id);
    await this.prisma.product.delete({ where: { id } });
    await this.redis.del(`catalog:product:${product.slug}`);
    return { message: 'Producto eliminado' };
  }

  // ─── Imágenes ───────────────────────────────────────────────────────────────

  async addProductImage(productId: string, dto: { url: string; alt?: string; position?: number }) {
    await this.getProductById(productId);
    const maxPosition = await this.prisma.productImage.count({ where: { productId } });
    return this.prisma.productImage.create({
      data: { productId, url: dto.url, alt: dto.alt, position: dto.position ?? maxPosition },
    });
  }

  async deleteProductImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({ where: { id: imageId, productId } });
    if (!image) throw new NotFoundException('Imagen no encontrada');
    await this.prisma.productImage.delete({ where: { id: imageId } });
    return { message: 'Imagen eliminada' };
  }

  // ─── Variantes ────────────────────────────────────────────────────────────────

  async addVariant(productId: string, dto: CreateVariantDto) {
    await this.getProductById(productId);
    return this.prisma.productVariant.create({ data: { productId, ...dto } });
  }

  async updateVariantStock(variantId: string, stock: number) {
    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: { stock },
    });
  }

  async getVariantById(variantId: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { name: true, slug: true } } },
    });
    if (!variant) throw new NotFoundException('Variante no encontrada');
    return variant;
  }

  async removeVariant(productId: string, variantId: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId },
    });
    if (!variant) throw new NotFoundException('Variante no encontrada');
    await this.prisma.productVariant.delete({ where: { id: variantId } });
    return { message: 'Variante eliminada' };
  }
}
