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

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    } else if (categorySlug) {
      const cat = await this.prisma.category.findUnique({ where: { slug: categorySlug } });
      if (cat) where.categoryId = cat.id;
    }

    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) where.basePrice.gte = minPrice;
      if (maxPrice) where.basePrice.lte = maxPrice;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { position: 'asc' }, take: 1 },
          variants: { select: { id: true, sku: true, price: true, stock: true, attributes: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginatedResult(products, total, page, limit);
  }

  async getProductBySlug(slug: string) {
    const cacheKey = `catalog:product:${slug}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const product = await this.prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        variants: true,
      },
    });

    if (!product) throw new NotFoundException('Producto no encontrado');

    await this.redis.setJson(cacheKey, product, CATALOG_CACHE_TTL);
    return product;
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

  async createProduct(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Ya existe un producto con ese slug');

    const { variants, ...productData } = dto;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
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
}
