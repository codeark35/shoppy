import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@libs/prisma';
import { OrderStatus, Role } from '@prisma/client';
import { AdminOrderQueryDto } from './dto/admin.dto';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

@Injectable()
export class AdminService {
  private readonly r2: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.r2 = new S3Client({
      region: 'auto',
      endpoint: `https://${config.getOrThrow<string>('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
    });
    this.bucket = config.getOrThrow<string>('R2_BUCKET_NAME');
    this.publicUrl = config.getOrThrow<string>('R2_PUBLIC_URL').replace(/\/$/, '');
  }

  // ─── Dashboard ────────────────────────────────────────────────────────────────

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalOrders,
      ordersThisMonth,
      pendingOrders,
      revenueThisMonth,
      totalProducts,
      lowStockCount,
      totalUsers,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.order.count({
        where: { status: { in: [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY_TO_SHIP] } },
      }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { in: [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY_TO_SHIP, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
          createdAt: { gte: startOfMonth },
        },
      }),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.productVariant.count({ where: { stock: { lte: 5 } } }),
      this.prisma.user.count({ where: { role: Role.CUSTOMER } }),
    ]);

    return {
      totalOrders,
      ordersThisMonth,
      pendingOrders,
      revenueThisMonth: revenueThisMonth._sum.total ?? 0,
      totalProducts,
      lowStockCount,
      totalUsers,
    };
  }

  // ─── Órdenes ──────────────────────────────────────────────────────────────────

  async getOrders(query: AdminOrderQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = query.status
      ? { status: query.status as OrderStatus }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true,
          payment: { select: { status: true, confirmedAt: true, amount: true } },
          shipping: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, trackingNumber?: string) {
    const updateData: any = { status };
    if (trackingNumber && status === OrderStatus.SHIPPED) {
      updateData.shipping = {
        update: { trackingNumber },
      };
    }
    return this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { shipping: true },
    });
  }

  // ─── Inventario ───────────────────────────────────────────────────────────────

  async getInventory(lowStockOnly = false, page = 1, limit = 20) {
    const where = lowStockOnly ? { stock: { lte: 5 } } : {};
    const skip = (page - 1) * limit;

    const [items, total, lowStockCount] = await Promise.all([
      this.prisma.productVariant.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: { select: { id: true, name: true, slug: true, images: { take: 1 } } },
        },
        orderBy: { stock: 'asc' },
      }),
      this.prisma.productVariant.count({ where }),
      this.prisma.productVariant.count({ where: { stock: { lte: 5 } } }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      lowStockCount,
    };
  }

  async updateStock(variantId: string, stock: number) {
    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: { stock },
      select: { id: true, sku: true, stock: true },
    });
  }

  // ─── Usuarios ─────────────────────────────────────────────────────────────────

  async getUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.user.count(),
    ]);
    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  async updateUserRole(userId: string, role: Role) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, role: true },
    });
  }

  // ─── Imágenes Huérfanas ───────────────────────────────────────────────────────

  async getOrphanedImages(): Promise<{ url: string; key: string }[]> {
    // 1. Listar todos los objetos en R2
    const r2Keys: string[] = [];
    let continuationToken: string | undefined;
    do {
      const res = await this.r2.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          ContinuationToken: continuationToken,
        }),
      );
      res.Contents?.forEach((obj) => { if (obj.Key) r2Keys.push(obj.Key); });
      continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (continuationToken);

    // 2. Obtener URLs registradas en la BD
    const dbImages = await this.prisma.productImage.findMany({
      select: { url: true },
    });

    const usedKeys = new Set(
      dbImages.map((img) => {
        try { return new URL(img.url).pathname.replace(/^\//, ''); }
        catch { return null; }
      }).filter(Boolean) as string[],
    );

    // 3. Filtrar las que no tienen registro
    return r2Keys
      .filter((key) => !usedKeys.has(key))
      .map((key) => ({ key, url: `${this.publicUrl}/${key}` }));
  }

  async assignOrphanedImage(
    url: string,
    productId: string,
    alt?: string,
    position?: number,
  ) {
    // Verificar que el producto exista
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const maxPosition = await this.prisma.productImage.count({ where: { productId } });
    return this.prisma.productImage.create({
      data: {
        productId,
        url,
        alt: alt ?? product.name,
        position: position ?? maxPosition,
      },
    });
  }
}
