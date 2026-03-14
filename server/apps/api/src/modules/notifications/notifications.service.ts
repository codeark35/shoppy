import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@libs/prisma';
import { SaveSubscriptionDto } from './dto/notifications.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('notifications') private readonly pushQueue: Queue,
  ) {}

  // ─── Suscripciones push ───────────────────────────────────────────────────

  async saveSubscription(userId: string, dto: SaveSubscriptionDto) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: { userId, endpoint: dto.endpoint, p256dh: dto.p256dh, auth: dto.auth },
      update: { userId, p256dh: dto.p256dh, auth: dto.auth },
    });
  }

  async removeSubscription(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
  }

  // ─── Encolar emails ───────────────────────────────────────────────────────

  async sendOrderConfirmation(to: string, orderNumber: number, total: number) {
    await this.emailQueue.add('send-email', {
      to,
      subject: `Pedido #${orderNumber} confirmado`,
      template: 'order-confirmation',
      context: { orderNumber, total },
    });
    this.logger.log(`Email de confirmación encolado para ${to}`);
  }

  async sendEmail(to: string, subject: string, template: string, context: Record<string, unknown> = {}) {
    await this.emailQueue.add('send-email', { to, subject, template, context });
  }

  // ─── Encolar push ─────────────────────────────────────────────────────────

  async sendPushToUser(userId: string, title: string, body: string, data?: Record<string, unknown>) {
    await this.pushQueue.add('send-push', { userId, title, body, data });
    this.logger.log(`Push encolado para usuario ${userId}`);
  }
}
