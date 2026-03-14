import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '@libs/prisma';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'notifications' },
    ),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
