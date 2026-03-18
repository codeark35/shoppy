import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';

import { PrismaModule } from '@libs/prisma';
import { RedisModule } from '@libs/redis';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MediaModule } from './modules/media/media.module';
import { AdminModule } from './modules/admin/admin.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SearchModule } from './modules/search/search.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { BannersModule } from './modules/banners/banners.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    // ─── Config ───────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ─── Eventos (comunicación entre módulos sin acoplamiento) ────────────────
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // ─── Rate limiting ────────────────────────────────────────────────────────
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50,
      },
    ]),

    // ─── BullMQ (colas asincrónicas) ──────────────────────────────────────────
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        },
      }),
    }),

    // ─── Libs globales ────────────────────────────────────────────────────────
    PrismaModule,
    RedisModule,

    // ─── Módulos de negocio (Fase 1) ─────────────────────────────────────────
    AuthModule,
    UsersModule,
    CatalogModule,
    InventoryModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    MediaModule,
    AdminModule,

    // ─── Módulos de negocio (Fase 2) ─────────────────────────────────────────
    ShippingModule,
    PromotionsModule,
    NotificationsModule,
    ReviewsModule,

    // ─── Módulos de negocio (Fase 3) ─────────────────────────────────────────
    ReportsModule,
    SearchModule,
    RecommendationsModule,
    BannersModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
