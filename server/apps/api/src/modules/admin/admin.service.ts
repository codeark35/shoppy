import { Injectable } from '@nestjs/common';
import { PrismaService } from '@libs/prisma';
import { OrderStatus, Role } from '@prisma/client';
import { AdminOrderQueryDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

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
}
