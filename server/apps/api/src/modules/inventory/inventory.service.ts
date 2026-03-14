import { Injectable, BadRequestException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@libs/prisma';
import { RedisService } from '@libs/redis';
import { OrderPaidEvent, ORDER_EVENTS } from '../../shared/events/order.events';

const STOCK_RESERVE_TTL = 15 * 60; // 15 minutos durante checkout

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ─── Reserva temporal durante checkout ───────────────────────────────────────

  async reserveStock(
    sessionId: string,
    items: Array<{ variantId: string; quantity: number }>,
  ): Promise<void> {
    for (const item of items) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.variantId },
      });

      if (!variant) {
        throw new BadRequestException(`Variante ${item.variantId} no existe`);
      }

      const reserveKey = `stock:reserve:${item.variantId}`;
      const reservedRaw = await this.redis.get(reserveKey);
      const alreadyReserved = reservedRaw ? parseInt(reservedRaw) : 0;
      const available = variant.stock - alreadyReserved;

      if (available < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para la variante ${variant.sku}. Disponible: ${available}`,
        );
      }

      // Incrementar reserva
      await this.redis.set(
        reserveKey,
        String(alreadyReserved + item.quantity),
        STOCK_RESERVE_TTL,
      );
    }
  }

  async releaseReserve(items: Array<{ variantId: string; quantity: number }>): Promise<void> {
    for (const item of items) {
      const reserveKey = `stock:reserve:${item.variantId}`;
      const reservedRaw = await this.redis.get(reserveKey);
      if (!reservedRaw) continue;

      const current = parseInt(reservedRaw);
      const newValue = Math.max(0, current - item.quantity);
      if (newValue === 0) {
        await this.redis.del(reserveKey);
      } else {
        await this.redis.set(reserveKey, String(newValue), STOCK_RESERVE_TTL);
      }
    }
  }

  // ─── Descontar stock al confirmar pago ───────────────────────────────────────

  @OnEvent(ORDER_EVENTS.PAID)
  async handleOrderPaid(event: OrderPaidEvent): Promise<void> {
    for (const item of event.items) {
      await this.prisma.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });

      // Liberar reserva
      const reserveKey = `stock:reserve:${item.variantId}`;
      await this.redis.del(reserveKey);
    }
  }

  // ─── Consulta de stock ────────────────────────────────────────────────────────

  async getVariantStock(variantId: string): Promise<{ stock: number; reserved: number; available: number }> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true },
    });

    if (!variant) return { stock: 0, reserved: 0, available: 0 };

    const reserveKey = `stock:reserve:${variantId}`;
    const reservedRaw = await this.redis.get(reserveKey);
    const reserved = reservedRaw ? parseInt(reservedRaw) : 0;

    return {
      stock: variant.stock,
      reserved,
      available: variant.stock - reserved,
    };
  }
}
