import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@libs/prisma';
import { RedisService } from '@libs/redis';
import { OrdersService } from '../orders/orders.service';
import { BancardService } from './bancard.service';
import { InitiatePaymentDto, BancardWebhookPayload } from './dto/payments.dto';

const PAYMENT_SESSION_TTL = 30 * 60; // 30 minutos (TTL Redis para tokens Bancard)

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly ordersService: OrdersService,
    private readonly bancardService: BancardService,
    private readonly config: ConfigService,
  ) {}

  // ─── Iniciar pago ─────────────────────────────────────────────────────────────

  async initiatePayment(userId: string, dto: InitiatePaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { payment: true },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.userId !== userId) throw new BadRequestException('Orden no pertenece al usuario');
    if (order.payment) throw new BadRequestException('Esta orden ya tiene un pago iniciado');

    const shopProcessId = uuidv4().replace(/-/g, '').substring(0, 20);
    const amount = order.total.toFixed(2);
    const returnUrl = `${this.config.get('FRONTEND_URL')}/checkout/result?order=${order.id}`;
    const cancelUrl = `${this.config.get('FRONTEND_URL')}/checkout/cancel?order=${order.id}`;

    // Crear registro de pago en BD
    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        shopProcessId,
        amount: order.total,
        status: PaymentStatus.PENDING,
      },
    });

    // Actualizar estado a PAYMENT_PROCESSING
    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'PAYMENT_PROCESSING' },
    });

    // Llamar a Bancard
    const { processId, redirectUrl } = await this.bancardService.initiateSingleBuy({
      shopProcessId,
      amount,
      currency: 'PYG',
      description: `Orden #${order.id.substring(0, 8)}`,
      returnUrl,
      cancelUrl,
    });

    // Guardar en Redis con TTL 30 min
    await this.redis.setJson(
      `payment:session:${shopProcessId}`,
      { orderId: order.id, processId },
      PAYMENT_SESSION_TTL,
    );

    return { orderId: order.id, shopProcessId, processId, redirectUrl };
  }

  // ─── Webhook Bancard ──────────────────────────────────────────────────────────
  // NUNCA confiar en el redirect del usuario — siempre esperar el webhook.
  // Implementar idempotencia: shopProcessId ya procesado = ignorar.

  async handleWebhook(payload: BancardWebhookPayload): Promise<{ status: string }> {
    const { operation } = payload;
    const { shop_process_id, response, amount } = operation;

    this.logger.log(`Webhook recibido para shopProcessId: ${shop_process_id}`);

    // 1. Buscar pago (idempotencia: si ya está APPROVED, ignorar)
    const payment = await this.prisma.payment.findUnique({
      where: { shopProcessId: shop_process_id },
    });

    if (!payment) {
      this.logger.warn(`Pago no encontrado para shopProcessId: ${shop_process_id}`);
      return { status: 'ignored' };
    }

    // Idempotencia: ya procesado
    if (payment.status !== PaymentStatus.PENDING) {
      this.logger.warn(`Webhook duplicado para shopProcessId: ${shop_process_id}`);
      return { status: 'already_processed' };
    }

    // 2. Validar firma HMAC — seguridad crítica
    const isValid = this.bancardService.validateWebhookToken(
      shop_process_id,
      amount,
      operation.token,
    );

    if (!isValid) {
      this.logger.error(`Firma inválida para shopProcessId: ${shop_process_id}`);
      return { status: 'invalid_signature' };
    }

    // 3. Actualizar estado según respuesta
    if (response === 'S') {
      await this.prisma.payment.update({
        where: { shopProcessId: shop_process_id },
        data: {
          status: PaymentStatus.APPROVED,
          confirmedAt: new Date(),
          rawWebhook: payload as any,
        },
      });

      // Marcar orden como pagada + emitir evento order.paid
      await this.ordersService.markAsPaid(payment.orderId);

      // Limpiar sesión de Redis
      await this.redis.del(`payment:session:${shop_process_id}`);

      this.logger.log(`Pago aprobado para orden: ${payment.orderId}`);
      return { status: 'approved' };
    } else {
      await this.prisma.payment.update({
        where: { shopProcessId: shop_process_id },
        data: {
          status: PaymentStatus.REJECTED,
          rawWebhook: payload as any,
        },
      });

      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'CANCELLED' },
      });

      this.logger.log(`Pago rechazado para orden: ${payment.orderId}`);
      return { status: 'rejected' };
    }
  }

  // ─── Consultar estado de pago ─────────────────────────────────────────────────

  async getPaymentByOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Orden no encontrada');
    }

    return this.prisma.payment.findUnique({
      where: { orderId },
      select: {
        id: true, status: true, amount: true,
        confirmedAt: true, shopProcessId: true,
      },
    });
  }
}
