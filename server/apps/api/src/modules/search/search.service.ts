import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@libs/prisma';
import { paginatedResult } from '@libs/common';
import { SearchQueryDto } from './dto/search.dto';

// Dynamic import to avoid hard dependency when Meilisearch is not installed
let MeiliSearch: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  MeiliSearch = require('meilisearch').MeiliSearch;
} catch {
  MeiliSearch = null;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: any = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const host = this.config.get<string>('MEILISEARCH_HOST');
    if (host && MeiliSearch) {
      const apiKey = this.config.get<string>('MEILISEARCH_API_KEY') ?? '';
      this.client = new MeiliSearch({ host, apiKey });
      this.logger.log(`Meilisearch conectado a ${host}`);
    } else {
      this.logger.warn(
        'Meilisearch no disponible — búsqueda usa Prisma como fallback',
      );
    }
  }

  async search(dto: SearchQueryDto) {
    if (this.client) {
      return this.searchWithMeilisearch(dto);
    }
    return this.searchWithPrisma(dto);
  }

  private async searchWithMeilisearch(dto: SearchQueryDto) {
    const { q, categorySlug, minPrice, maxPrice, page = 1, limit = 20 } = dto;
    const filters: string[] = ['isActive = true'];
    if (categorySlug) filters.push(`categorySlug = "${categorySlug}"`);
    if (minPrice != null) filters.push(`basePrice >= ${minPrice}`);
    if (maxPrice != null) filters.push(`basePrice <= ${maxPrice}`);

    const result = await this.client.index('products').search(q, {
      filter: filters.join(' AND '),
      limit,
      offset: (page - 1) * limit,
      attributesToHighlight: ['name', 'description'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
    });

    return paginatedResult(result.hits, result.estimatedTotalHits ?? 0, page, limit);
  }

  private async searchWithPrisma(dto: SearchQueryDto) {
    const { q, categorySlug, minPrice, maxPrice, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;
    const where: any = {
      isActive: true,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    };

    if (categorySlug) {
      const cat = await this.prisma.category.findUnique({
        where: { slug: categorySlug },
      });
      if (cat) where.categoryId = cat.id;
    }

    if (minPrice != null || maxPrice != null) {
      where.basePrice = {};
      if (minPrice != null) where.basePrice.gte = minPrice;
      if (maxPrice != null) where.basePrice.lte = maxPrice;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { position: 'asc' }, take: 1 },
          variants: {
            select: { id: true, sku: true, price: true, stock: true, attributes: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginatedResult(products, total, page, limit);
  }

  async indexAllProducts() {
    if (!this.client) return { message: 'Meilisearch no está configurado' };

    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { name: true, slug: true } },
        images: { orderBy: { position: 'asc' }, take: 1 },
      },
    });

    const documents = products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      basePrice: Number(p.basePrice),
      categorySlug: p.category.slug,
      categoryName: p.category.name,
      imageUrl: p.images[0]?.url ?? null,
      isActive: p.isActive,
    }));

    await this.client.index('products').addDocuments(documents);
    this.logger.log(`${documents.length} productos indexados en Meilisearch`);
    return { indexed: documents.length };
  }

  async indexProduct(productId: string) {
    if (!this.client) return;

    const p = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: { select: { name: true, slug: true } },
        images: { orderBy: { position: 'asc' }, take: 1 },
      },
    });
    if (!p) return;

    await this.client.index('products').addDocuments([
      {
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        basePrice: Number(p.basePrice),
        categorySlug: p.category.slug,
        categoryName: p.category.name,
        imageUrl: p.images[0]?.url ?? null,
        isActive: p.isActive,
      },
    ]);
  }

  async removeProduct(productId: string) {
    if (!this.client) return;
    await this.client.index('products').deleteDocument(productId);
  }
}
