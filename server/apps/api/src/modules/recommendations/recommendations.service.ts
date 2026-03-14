import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@libs/prisma';

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRelated(productId: string, limit = 8) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    return this.prisma.product.findMany({
      where: { categoryId: product.categoryId, isActive: true, id: { not: productId } },
      take: limit,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { position: 'asc' }, take: 1 },
        variants: { select: { id: true, price: true, stock: true, attributes: true }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFrequentlyBoughtTogether(productId: string, limit = 6) {
    const productVariants = await this.prisma.productVariant.findMany({
      where: { productId },
      select: { sku: true },
    });

    const skus = productVariants.map((v) => v.sku);
    if (!skus.length) return this.getRelated(productId, limit);

    // Órdenes que contienen alguna variante de este producto
    const orderItems = await this.prisma.orderItem.findMany({
      where: { sku: { in: skus } },
      select: { orderId: true },
      take: 200,
    });
    const orderIds = [...new Set(orderItems.map((o) => o.orderId))];

    if (!orderIds.length) return this.getRelated(productId, limit);

    // Otros items comprados juntos
    const coItems = await this.prisma.orderItem.groupBy({
      by: ['sku', 'name'],
      where: { orderId: { in: orderIds }, sku: { notIn: skus } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit * 3,
    });

    if (!coItems.length) return this.getRelated(productId, limit);

    const coSkus = coItems.map((i) => i.sku);
    const variants = await this.prisma.productVariant.findMany({
      where: { sku: { in: coSkus } },
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
            images: { orderBy: { position: 'asc' }, take: 1 },
            variants: { select: { id: true, price: true, stock: true, attributes: true }, take: 1 },
          },
        },
      },
    });

    // Deduplicar por producto
    const seen = new Set<string>();
    const products: any[] = [];
    for (const v of variants) {
      if (!seen.has(v.productId) && v.product.isActive) {
        seen.add(v.productId);
        products.push(v.product);
        if (products.length >= limit) break;
      }
    }

    // Completar con productos relacionados si no hay suficiente
    if (products.length < limit) {
      const seenIds = new Set(products.map((p) => p.id));
      const related = await this.getRelated(productId, limit);
      for (const p of related) {
        if (!seenIds.has(p.id)) {
          products.push(p);
          if (products.length >= limit) break;
        }
      }
    }

    return products.slice(0, limit);
  }
}
