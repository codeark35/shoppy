import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: process.env.NODE_ENV === 'development' }),
  );

  // ─── Seguridad ──────────────────────────────────────────────────────────────
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false, // se configura en Cloudflare
  });

  await app.register(fastifyCors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB

  await app.register(fastifyCookie, {
    secret: process.env.JWT_REFRESH_SECRET || 'cookie-secret-change-me',
  });

  // ─── Validación global ──────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,         // elimina propiedades no declaradas en el DTO
      forbidNonWhitelisted: true,
      transform: true,         // transforma payload al tipo del DTO
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── Prefijo global ─────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 API corriendo en http://localhost:${port}/api/v1`);
}

bootstrap();
