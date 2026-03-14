import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '@libs/prisma';
import { RedisModule } from '@libs/redis';
import { NotificationProcessor } from './processors/notification.processor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'notifications' },
    ),
    PrismaModule,
    RedisModule,
  ],
  providers: [NotificationProcessor],
})
export class WorkerAppModule {}
