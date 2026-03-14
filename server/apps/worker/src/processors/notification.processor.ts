import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Resend } from 'resend';
import * as webpush from 'web-push';
import { PrismaService } from '@libs/prisma';

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

export interface NotificationJobData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

// Configurar VAPID una sola vez al cargar el módulo
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:soporte@mitienda.com.py',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

@Processor('email')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);
  private readonly resend = new Resend(process.env.RESEND_API_KEY ?? '');

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Procesando job: ${job.name} [${job.id}]`);

    switch (job.name) {
      case 'send-email':
        await this.handleSendEmail(job.data as EmailJobData);
        break;
      case 'send-push':
        await this.handleSendPush(job.data as NotificationJobData);
        break;
      default:
        this.logger.warn(`Job desconocido: ${job.name}`);
    }
  }

  private async handleSendEmail(data: EmailJobData): Promise<void> {
    const from = process.env.RESEND_FROM ?? 'Mi Tienda <noreply@mitienda.com.py>';
    const html = this.buildEmailHtml(data.template, data.context);

    const { error } = await this.resend.emails.send({
      from,
      to: data.to,
      subject: data.subject,
      html,
    });

    if (error) {
      this.logger.error(`Error enviando email a ${data.to}: ${JSON.stringify(error)}`);
      throw new Error(`Resend error: ${error.message}`);
    }

    this.logger.log(`[Email] Enviado a ${data.to} | Asunto: ${data.subject}`);
  }

  private async handleSendPush(data: NotificationJobData): Promise<void> {
    if (!process.env.VAPID_PUBLIC_KEY) {
      this.logger.warn('VAPID_PUBLIC_KEY no configurado, omitiendo push');
      return;
    }

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId: data.userId },
    });

    if (!subscriptions.length) {
      this.logger.log(`Sin suscripciones push para usuario ${data.userId}`);
      return;
    }

    const payload = JSON.stringify({ title: data.title, body: data.body, data: data.data });

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
        } catch (err: any) {
          // Suscripción expirada o inválida (410 Gone) — eliminar
          if (err.statusCode === 410 || err.statusCode === 404) {
            await this.prisma.pushSubscription.delete({ where: { id: sub.id } });
            this.logger.warn(`Push subscription eliminada (${err.statusCode}): ${sub.endpoint}`);
          } else {
            this.logger.error(`Error enviando push: ${err.message}`);
          }
        }
      }),
    );

    this.logger.log(`[Push] Enviado a ${subscriptions.length} suscripción(es) del usuario ${data.userId}`);
  }

  private buildEmailHtml(template: string, context: Record<string, any>): string {
    const primary = '#0F4C81';
    const accent = '#F97316';

    switch (template) {
      case 'order-confirmation':
        return `
          <div style="font-family:'DM Sans',Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h1 style="font-family:'Sora',Arial,sans-serif;color:${primary}">¡Pedido confirmado!</h1>
            <p>Tu pedido <strong>#${context.orderNumber}</strong> fue recibido correctamente.</p>
            <p>Total: <strong style="color:${accent}">${Number(context.total).toLocaleString('es-PY')} Gs.</strong></p>
            <p style="margin-top:24px;color:#666">Gracias por tu compra en Mi Tienda.</p>
          </div>`;
      default:
        return `<div style="font-family:Arial,sans-serif;padding:24px">${JSON.stringify(context)}</div>`;
    }
  }
}
