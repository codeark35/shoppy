import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus, Role } from '@prisma/client';
import { PrismaService } from '@libs/prisma';
import { CartService } from '../cart/cart.service';
import { InventoryService } from '../inventory/inventory.service';
import { PromotionsService } from '../promotions/promotions.service';
import { ShippingService } from '../shipping/shipping.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';
import {
  OrderPaidEvent,
  OrderStatusChangedEvent,
  ORDER_EVENTS,
} from '../../shared/events/order.events';
import { Decimal } from '@prisma/client/runtime/library';

// Transiciones de estado válidas
const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.PENDING]: [OrderStatus.PAYMENT_PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PAYMENT_PROCESSING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PREPARING, OrderStatus.REFUNDED],
  [OrderStatus.PREPARING]: [OrderStatus.READY_TO_SHIP, OrderStatus.CANCELLED],
  [OrderStatus.READY_TO_SHIP]: [OrderStatus.SHIPPED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED, OrderStatus.REFUNDED],
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly inventoryService: InventoryService,
    private readonly eventEmitter: EventEmitter2,
    private readonly promotionsService: PromotionsService,
    private readonly shippingService: ShippingService,
  ) {}

  // ─── Crear orden desde carrito ────────────────────────────────────────────────

  async createFromCart(userId: string, dto: CreateOrderDto) {
    const cart = await this.cartService.getUserCart(userId);

    if (cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    // Verificar reserva de stock
    await this.inventoryService.reserveStock(
      userId,
      cart.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    );

    const pricing = await this.promotionsService.calculatePricing(cart.items, {
      couponCode: dto.couponCode,
      strategy: dto.promotionStrategy,
    });

    // Mapa variantId → descuento de línea (todas las unidades) para snapshot
    const discountByVariant = new Map(
      pricing.appliedItems.map((a) => [a.variantId, a]),
    );

    let subtotal = pricing.subtotalAfter;
    const discountAmount: Decimal | undefined = pricing.totalDiscount > 0
      ? new Decimal(pricing.totalDiscount)
      : undefined;
    const couponId = pricing.appliedCouponId;

    if (couponId) {
      // Incrementar contador de uso solo si el cupón quedó aplicado
      await this.prisma.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Resolver tarifa de envío
    let shippingCost = 0;
    const shippingRateId = dto.shippingRateId;
    if (shippingRateId) {
      const rate = await this.shippingService.getRateById(shippingRateId);
      shippingCost = Number(rate.price);
    }

    const finalTotal = new Decimal((subtotal + shippingCost).toFixed(2));

    const order = await this.prisma.order.create({
      data: {
        userId,
        total: finalTotal,
        discountAmount,
        couponId,
        notes: dto.notes,
        shipping: {
          create: {
            addressLabel: dto.shippingAddress.addressLabel,
            street: dto.shippingAddress.street,
            city: dto.shippingAddress.city,
            department: dto.shippingAddress.department,
            recipientName: dto.shippingAddress.recipientName,
            phone: dto.shippingAddress.phone,
            country: dto.shippingAddress.country ?? 'PY',
            zipCode: dto.shippingAddress.zipCode,
            shippingRateId,
            shippingCost,
          },
        },
        items: {
          create: cart.items.map((item) => {
            const applied = discountByVariant.get(item.variantId);
            const unitDiscountApplied = applied
              ? new Decimal((applied.discount / item.quantity).toFixed(2))
              : new Decimal(0);
            const unitPriceFinal = new Decimal(
              Math.max(0, item.price - Number(unitDiscountApplied)).toFixed(2),
            );
            return {
              variantId: item.variantId,
              sku: item.sku,
              name: item.name,
              imageUrl: item.imageUrl,
              price: item.price,
              quantity: item.quantity,
              unitDiscountApplied,
              unitPriceFinal,
            };
          }),
        },
      },
      include: {
        items: true,
        shipping: true,
      },
    });

    return order;
  }

  // ─── Obtener órdenes del usuario ──────────────────────────────────────────────

  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        payment: { select: { status: true, confirmedAt: true, amount: true } },
        shipping: { select: { trackingNumber: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(orderId: string, userId: string, userRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payment: true,
        shipping: true,
      },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');

    // Solo el dueño o admin puede ver la orden
    if (order.userId !== userId && userRole !== Role.ADMIN && userRole !== Role.WAREHOUSE) {
      throw new ForbiddenException('No tienes acceso a esta orden');
    }

    return order;
  }

  // ─── Actualizar estado (admin / warehouse) ────────────────────────────────────

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');

    const newStatus = dto.status as OrderStatus;
    const validNext = VALID_TRANSITIONS[order.status];

    if (!validNext || !validNext.includes(newStatus)) {
      throw new BadRequestException(
        `Transición inválida: ${order.status} → ${newStatus}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: { items: true, payment: true, shipping: true },
    });

    this.eventEmitter.emit(
      ORDER_EVENTS.STATUS_CHANGED,
      new OrderStatusChangedEvent(orderId, order.userId, order.status, newStatus),
    );

    return updated;
  }

  // ─── Llamado por PaymentsService al confirmar webhook Bancard ─────────────────

  async markAsPaid(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PAID },
    });

    // Emitir evento — inventory y notifications escuchan esto
    this.eventEmitter.emit(
      ORDER_EVENTS.PAID,
      new OrderPaidEvent(
        orderId,
        order.userId,
        order.items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          name: i.name,
          price: Number(i.price),
        })),
        Number(order.total),
      ),
    );

    // Limpiar carrito del usuario
    await this.cartService.clearCart(`cart:user:${order.userId}`);

    return updated;
  }

  // ─── Admin: listar todas las órdenes ─────────────────────────────────────────

  async getAllOrders(status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: status ? { status } : {},
      include: {
        items: true,
        payment: { select: { status: true, confirmedAt: true, amount: true } },
        shipping: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
