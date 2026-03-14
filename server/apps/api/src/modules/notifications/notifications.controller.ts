import { Controller, Post, Delete, Body, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SaveSubscriptionDto } from './dto/notifications.dto';
import { JwtAuthGuard } from '@libs/common';
import { FastifyRequest } from 'fastify';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** POST /notifications/push/subscribe — guardar suscripción VAPID */
  @Post('push/subscribe')
  subscribe(@Req() req: FastifyRequest & { user: { id: string } }, @Body() dto: SaveSubscriptionDto) {
    return this.notificationsService.saveSubscription(req.user.id, dto);
  }

  /** DELETE /notifications/push/unsubscribe — eliminar suscripción */
  @Delete('push/unsubscribe')
  unsubscribe(
    @Req() req: FastifyRequest & { user: { id: string } },
    @Body('endpoint') endpoint: string,
  ) {
    return this.notificationsService.removeSubscription(req.user.id, endpoint);
  }
}
