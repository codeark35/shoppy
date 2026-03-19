# Guía de Arquitectura Backend — Estándar Empresarial

> **Versión:** 1.0 | **Actualizado:** Marzo 2026  
> Documento de referencia para todos los proyectos backend. Aplicar desde el primer commit.

---

## Índice

1. [Principios Fundamentales](#1-principios-fundamentales)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura de Carpetas](#3-estructura-de-carpetas)
4. [Arquitectura de Módulos](#4-arquitectura-de-módulos)
5. [Convenciones de Código](#5-convenciones-de-código)
6. [Base de Datos y Prisma](#6-base-de-datos-y-prisma)
7. [Autenticación y Autorización](#7-autenticación-y-autorización)
8. [Validación y DTOs](#8-validación-y-dtos)
9. [Manejo de Errores](#9-manejo-de-errores)
10. [Redis y Caché](#10-redis-y-caché)
11. [Seguridad](#11-seguridad)
12. [Variables de Entorno](#12-variables-de-entorno)
13. [Testing](#13-testing)
14. [Checklist por Módulo](#14-checklist-por-módulo)
15. [Errores Comunes a Evitar](#15-errores-comunes-a-evitar)

---

## 1. Principios Fundamentales

| Principio | Descripción |
|---|---|
| **Modular** | Cada dominio de negocio es un módulo NestJS independiente |
| **Separation of Concerns** | Controller → Service → Repository. Cada capa tiene una sola responsabilidad |
| **Fail Fast** | Validar entradas lo antes posible, antes de llegar al servicio |
| **Type Safety** | TypeScript estricto en todo. Prohibido `any` |
| **Stateless** | Los servicios no guardan estado en memoria. El estado va en PostgreSQL o Redis |
| **Audit First** | Toda operación crítica de negocio debe dejar rastro en auditoría |
| **No Lógica en Controllers** | Los controllers solo reciben, delegan y responden |

---

## 2. Stack Tecnológico

### Core

```json
{
  "@nestjs/core": "^11.x",
  "@nestjs/platform-fastify": "^11.x",
  "typescript": "~5.x"
}
```

> **Adapter:** Siempre Fastify, nunca Express. Mayor rendimiento y menor overhead.

### Base de Datos

```json
{
  "@prisma/client": "^6.x",
  "prisma": "^6.x"
}
```

### Autenticación

```json
{
  "@nestjs/jwt": "^11.x",
  "@nestjs/passport": "^11.x",
  "passport-jwt": "^4.x",
  "bcrypt": "^5.x"
}
```

> **Firma JWT:** RS256 (asimétrico) para sistemas multi-servicio. HS256 solo en proyectos simples de un solo servicio.

### Caché y sesiones

```json
{
  "ioredis": "^5.x",
  "@nestjs/cache-manager": "^3.x",
  "cache-manager-ioredis-yet": "^2.x"
}
```

### Validación

```json
{
  "class-validator": "^0.14.x",
  "class-transformer": "^0.5.x",
  "@nestjs/mapped-types": "^2.x"
}
```

### Utilidades

```json
{
  "@nestjs/config": "^4.x",
  "@nestjs/throttler": "^6.x",
  "@nestjs/swagger": "^8.x",
  "nestjs-pino": "^4.x"
}
```

---

## 3. Estructura de Carpetas

```
server/
├── src/
│   ├── main.ts                          # Bootstrap — Fastify, pipes, swagger, cors
│   ├── app.module.ts                    # Módulo raíz — importa todos los módulos
│   │
│   ├── config/                          # ⚙️ Configuración centralizada
│   │   ├── app.config.ts                # Puerto, entorno, prefijo global
│   │   ├── database.config.ts           # Config de Prisma/PostgreSQL
│   │   ├── jwt.config.ts                # Secrets, expiración, algoritmo
│   │   └── redis.config.ts              # Host, puerto, TTL por defecto
│   │
│   ├── common/                          # 🔄 Infraestructura compartida
│   │   ├── decorators/                  # @CurrentUser, @Roles, @Public
│   │   ├── filters/                     # GlobalExceptionFilter
│   │   ├── guards/                      # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/                # LoggingInterceptor, TransformInterceptor
│   │   ├── pipes/                       # ValidationPipe global
│   │   └── types/                       # Tipos compartidos (JwtPayload, PaginatedResult)
│   │
│   ├── prisma/                          # 🗄️ Capa de base de datos
│   │   └── prisma.service.ts            # PrismaClient singleton con onModuleInit
│   │
│   └── modules/                         # 📦 Módulos de negocio
│       ├── auth/
│       ├── users/
│       ├── products/
│       ├── customers/
│       ├── sales/
│       └── [dominio]/
│
├── prisma/
│   ├── schema.prisma                    # Schema único de la base de datos
│   ├── migrations/                      # Migraciones generadas por Prisma
│   └── seed.ts                          # Datos iniciales (roles, admin, config)
│
├── test/                                # Tests e2e
├── .env.example
├── docker-compose.yml                   # PostgreSQL + Redis para desarrollo
└── tsconfig.json
```

### Reglas de dependencias entre capas

```
modules/     →  puede importar de  →  common/, prisma/, config/
common/      →  puede importar de  →  config/
config/      →  NO importa de modules/ ni common/
prisma/      →  NO importa de modules/
```

**Un módulo NUNCA importa directamente de otro módulo.** Si necesita datos de otro dominio, se inyecta el servicio del módulo exportándolo explícitamente, o se usa un evento.

---

## 4. Arquitectura de Módulos

### Estructura obligatoria de cada módulo

```
modules/[nombre]/
├── [nombre].module.ts          # Declara controllers, providers, exports
├── [nombre].controller.ts      # Rutas HTTP — solo recibe y delega
├── [nombre].service.ts         # Lógica de negocio
├── dto/
│   ├── create-[nombre].dto.ts
│   ├── update-[nombre].dto.ts
│   └── filter-[nombre].dto.ts
└── entities/
    └── [nombre].entity.ts      # Tipo TypeScript del modelo (no Prisma directo)
```

### Responsabilidades por capa

**Controller** — Entrada HTTP
- Recibe request, extrae parámetros, llama al service
- Aplica decoradores: `@Roles`, `@UseGuards`, `@ApiOperation`
- Nunca contiene lógica de negocio ni accede a Prisma

**Service** — Lógica de negocio
- Toda la lógica vive aquí
- Accede a Prisma y Redis
- Lanza excepciones de NestJS (`NotFoundException`, `ConflictException`, etc.)
- Registra en auditoría las operaciones críticas

**DTO** — Contrato de entrada
- Valida con `class-validator`
- Documenta con `@ApiProperty`
- `UpdateDto` extiende de `PartialType(CreateDto)`

### Ejemplo de módulo completo

```typescript
// modules/products/products.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],   // exportar solo si otro módulo lo necesita
})
export class ProductsModule {}

// modules/products/products.controller.ts
@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Roles('admin', 'manager', 'employee')
  @ApiOperation({ summary: 'Listar productos con paginación' })
  findAll(@Query() filters: FilterProductDto) {
    return this.productsService.findAll(filters);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'employee')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.create(dto, user.sub);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.update(id, dto, user.sub);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.remove(id, user.sub);
  }
}

// modules/products/products.service.ts
@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: FilterProductDto): Promise<PaginatedResult<Product>> {
    const { page = 1, limit = 20, search, categoryId } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(categoryId && { categoryId }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Producto ${id} no encontrado`);
    return product;
  }

  async create(dto: CreateProductDto, userId: string): Promise<Product> {
    const existing = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });
    if (existing) throw new ConflictException(`El SKU ${dto.sku} ya existe`);

    return this.prisma.product.create({ data: { ...dto, createdBy: userId } });
  }

  async update(id: string, dto: UpdateProductDto, userId: string): Promise<Product> {
    await this.findOne(id);   // lanza NotFoundException si no existe
    return this.prisma.product.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id);
    // Soft delete — nunca borrar registros en sistemas ERP
    await this.prisma.product.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date(), deletedBy: userId },
    });
  }
}
```

---

## 5. Convenciones de Código

### Nomenclatura de archivos

```
kebab-case  →  Todo: products.service.ts, jwt-auth.guard.ts
PascalCase  →  Clases: ProductsService, JwtAuthGuard
camelCase   →  Métodos y variables: findAll, createProduct
UPPER_SNAKE →  Constantes y enums: UserRole.ADMIN, MAX_LOGIN_ATTEMPTS
```

### Estructura interna de un Service

```typescript
@Injectable()
export class ProductsService {
  // 1. Constructor con inyección de dependencias
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,        // si aplica
  ) {}

  // 2. Métodos públicos — en orden CRUD
  async findAll(filters: FilterProductDto) { }
  async findOne(id: string) { }
  async create(dto: CreateProductDto, userId: string) { }
  async update(id: string, dto: UpdateProductDto, userId: string) { }
  async remove(id: string, userId: string) { }

  // 3. Métodos privados — helpers internos al final
  private buildWhereClause(filters: FilterProductDto): Prisma.ProductWhereInput { }
  private async validateUniqueSku(sku: string, excludeId?: string) { }
}
```

### Respuestas HTTP estándar

| Operación | Status code |
|---|---|
| GET (lista o detalle) | `200 OK` |
| POST (crear) | `201 Created` |
| PATCH / PUT (actualizar) | `200 OK` |
| DELETE (eliminar) | `204 No Content` |
| Error de validación | `400 Bad Request` |
| No autenticado | `401 Unauthorized` |
| Sin permisos | `403 Forbidden` |
| No encontrado | `404 Not Found` |
| Conflicto (duplicado) | `409 Conflict` |
| Error interno | `500 Internal Server Error` |

---

## 6. Base de Datos y Prisma

### Convenciones del schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── Campos obligatorios en TODA tabla de negocio ──────────
model Product {
  id        String    @id @default(cuid())
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  // Soft delete — obligatorio en sistemas ERP
  isActive  Boolean   @default(true)
  deletedAt DateTime?

  // Auditoría — quién hizo qué
  createdBy String?
  updatedBy String?
  deletedBy String?

  // Campos del dominio
  sku       String    @unique
  name      String
  // ...

  @@map("products")   // nombre de tabla en snake_case
}
```

### Reglas del schema

- `id` siempre `cuid()` — nunca autoincrement en sistemas distribuidos
- Toda tabla de negocio tiene `createdAt`, `updatedAt`, `isActive`, `deletedAt`
- Nombres de tablas en `snake_case` con `@@map()`
- Nombres de campos en `camelCase` en el schema, `snake_case` en la DB vía `@map()`
- **Nunca** hacer `DELETE` físico en tablas de negocio — siempre soft delete
- Índices en campos que se filtran frecuentemente: `@@index([isActive, categoryId])`

### PrismaService

```typescript
// prisma/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  // Helper para paginación consistente
  async paginate<T>(
    model: any,
    { page = 1, limit = 20 }: { page?: number; limit?: number },
    args: any = {},
  ): Promise<PaginatedResult<T>> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.$transaction([
      model.findMany({ ...args, skip, take: limit }),
      model.count({ where: args.where }),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
```

### Transacciones — cuándo usarlas

```typescript
// Siempre que haya más de una escritura relacionada
async createSale(dto: CreateSaleDto, userId: string) {
  return this.prisma.$transaction(async (tx) => {
    // 1. Crear la venta
    const sale = await tx.sale.create({ data: { ...dto, userId } });

    // 2. Descontar stock de cada ítem
    for (const item of dto.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });
    }

    // 3. Crear los ítems de venta
    await tx.saleItem.createMany({
      data: dto.items.map(item => ({ ...item, saleId: sale.id })),
    });

    return sale;
  });
}
```

### Migraciones

```bash
# Desarrollo — genera migración desde cambios en schema
npx prisma migrate dev --name descripcion_del_cambio

# Producción — aplica migraciones pendientes
npx prisma migrate deploy

# Nunca editar manualmente archivos de migración ya aplicados
```

---

## 7. Autenticación y Autorización

### Flujo de autenticación

```
Login → validar credenciales → generar accessToken (15min) + refreshToken (7d)
       → guardar refreshToken hash en Redis con TTL
       → cliente guarda tokens

Request protegido → JwtAuthGuard valida accessToken
                  → si expirado → /auth/refresh con refreshToken
                  → validar refreshToken contra Redis
                  → rotar: invalidar anterior, emitir nuevo par
```

### Decoradores personalizados obligatorios

```typescript
// common/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.user?.[data] : request.user;
  },
);

// common/decorators/roles.decorator.ts
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// common/decorators/public.decorator.ts — marcar rutas sin auth
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### Guards

```typescript
// common/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}

// common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user?.role);
  }
}
```

### Registro global de guards en AppModule

```typescript
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },   // aplica a todas las rutas
  { provide: APP_GUARD, useClass: RolesGuard },
]
```

---

## 8. Validación y DTOs

### Estructura estándar de DTOs

```typescript
// dto/create-product.dto.ts
export class CreateProductDto {
  @ApiProperty({ example: 'TORN-3/4-A', description: 'Código único del producto' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sku: string;

  @ApiProperty({ example: 'Tornillo 3/4" acero' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 1500.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  retailPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

// dto/update-product.dto.ts
export class UpdateProductDto extends PartialType(CreateProductDto) {}

// dto/filter-product.dto.ts
export class FilterProductDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
```

### ValidationPipe global en main.ts

```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,          // elimina propiedades no declaradas en el DTO
  forbidNonWhitelisted: true, // lanza error si llegan propiedades extra
  transform: true,          // convierte tipos automáticamente (string → number)
  transformOptions: {
    enableImplicitConversion: true,
  },
}));
```

---

## 9. Manejo de Errores

### Excepciones NestJS — usar siempre las nativas

```typescript
throw new NotFoundException('Producto no encontrado');
throw new ConflictException('El SKU ya existe');
throw new BadRequestException('Stock insuficiente');
throw new ForbiddenException('Sin permisos para esta operación');
throw new UnauthorizedException('Token inválido o expirado');
throw new InternalServerErrorException('Error al procesar la operación');
```

### Filtro global de excepciones

```typescript
// common/filters/global-exception.filter.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message;
      errors = Array.isArray(message) ? message : undefined;
      if (errors) message = 'Error de validación';
    }

    // Log solo errores 5xx — los 4xx son errores del cliente
    if (status >= 500) {
      this.logger.error(exception, `${request.method} ${request.url}`);
    }

    response.status(status).send({
      statusCode: status,
      message,
      errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Formato de respuesta de error estándar

```json
{
  "statusCode": 404,
  "message": "Producto no encontrado",
  "path": "/api/products/xyz-123",
  "timestamp": "2026-03-19T12:00:00.000Z"
}
```

---

## 10. Redis y Caché

### Casos de uso en sistemas ERP

| Uso | TTL recomendado |
|---|---|
| Refresh tokens | 7 días |
| Sesiones de usuario | 24 horas |
| Caché de listas (productos, categorías) | 2–5 minutos |
| Rate limiting | 1 minuto |
| Códigos de verificación | 10–15 minutos |
| Config/parámetros del sistema | 30 minutos |

### RedisService base

```typescript
// common/services/redis.service.ts
@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor(private config: ConfigService) {
    this.client = new Redis({
      host: config.get('REDIS_HOST', 'localhost'),
      port: config.get<number>('REDIS_PORT', 6379),
      password: config.get('REDIS_PASSWORD'),
      keyPrefix: `${config.get('APP_NAME', 'app')}:`,
    });
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
```

---

## 11. Seguridad

### Configuración en main.ts

```typescript
// main.ts
import { FastifyAdapter } from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import { fastifyCors } from '@fastify/cors';

const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter({ logger: false }),
);

// Helmet — cabeceras de seguridad
await app.register(helmet, {
  contentSecurityPolicy: false, // ajustar si sirve frontend
});

// CORS — solo orígenes explícitos, nunca '*' en producción
await app.register(fastifyCors, {
  origin: process.env.CLIENT_URL,     // string directo, no array
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
});

// Rate limiting global
app.use(ThrottlerModule);

// Prefijo global de API
app.setGlobalPrefix('api');
```

### ThrottlerModule

```typescript
// app.module.ts
ThrottlerModule.forRoot([{
  ttl: 60_000,    // ventana de 1 minuto
  limit: 100,     // máximo 100 requests por IP por ventana
}]),

// Para endpoints de auth — límite más estricto
@Throttle({ default: { ttl: 60_000, limit: 5 } })
@Post('login')
login(@Body() dto: LoginDto) { }
```

### Reglas generales

- Nunca loguear passwords, tokens ni datos sensibles
- Siempre hashear passwords con bcrypt, rounds mínimo 12
- Validar y sanitizar todos los inputs antes de usar en queries
- Usar `@Exclude()` de class-transformer en campos sensibles del response
- Los errores internos (500) no deben exponer stack traces al cliente

---

## 12. Variables de Entorno

### `.env.example` — obligatorio en el repositorio

```bash
# App
NODE_ENV=development
PORT=3000
APP_NAME=mi-sistema
CLIENT_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/db_name

# JWT
JWT_ACCESS_SECRET=cambiar_en_produccion
JWT_REFRESH_SECRET=cambiar_en_produccion_diferente
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Opcional
SENTRY_DSN=
```

### ConfigService — acceso centralizado

```typescript
// config/app.config.ts
export default registerAs('app', () => ({
  port:      parseInt(process.env.PORT ?? '3000'),
  env:       process.env.NODE_ENV ?? 'development',
  name:      process.env.APP_NAME ?? 'app',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  isDev:     process.env.NODE_ENV !== 'production',
}));

// Uso en servicios
constructor(private config: ConfigService) {}
const port = this.config.get<number>('app.port');
```

---

## 13. Testing

### Qué testear y con qué prioridad

| Tipo | Herramienta | Prioridad |
|---|---|---|
| Services (lógica de negocio) | Jest + mocks de Prisma | Alta |
| Controllers (rutas y permisos) | Jest + supertest | Media |
| Guards y decoradores | Jest | Alta |
| Flujos completos (e2e) | Jest + supertest | Media |
| Funciones utilitarias puras | Jest | Alta |

### Test de Service con Prisma mockeado

```typescript
// products.service.spec.ts
describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
      ],
    }).compile();

    service = module.get(ProductsService);
    prisma  = module.get(PrismaService);
  });

  it('lanza NotFoundException si el producto no existe', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    await expect(service.findOne('id-inexistente')).rejects.toThrow(NotFoundException);
  });

  it('lanza ConflictException si el SKU ya existe', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'otro-id' } as any);
    await expect(service.create({ sku: 'TORN-1' } as any, 'user-1'))
      .rejects.toThrow(ConflictException);
  });
});
```

---

## 14. Checklist por Módulo

Aplicar antes de hacer merge de cualquier módulo nuevo.

### Arquitectura

- [ ] Controller no contiene lógica de negocio
- [ ] Service no accede directamente a request/response HTTP
- [ ] El módulo no importa directamente de otro módulo sin exportarlo
- [ ] Soft delete implementado (nunca DELETE físico en tablas de negocio)
- [ ] Operaciones críticas registradas en auditoría

### Base de datos

- [ ] Schema tiene `id`, `createdAt`, `updatedAt`, `isActive`, `deletedAt`
- [ ] Migración generada y probada
- [ ] Índices en campos de filtro frecuente
- [ ] Operaciones multi-tabla usan `$transaction`

### Seguridad

- [ ] Todas las rutas tienen `@Roles()` definido explícitamente
- [ ] Rutas públicas marcadas con `@Public()`
- [ ] Rate limiting en endpoints de auth
- [ ] DTOs con `whitelist: true` (no pasan campos extra)

### Validación

- [ ] Todos los DTOs tienen decoradores de `class-validator`
- [ ] DTOs documentados con `@ApiProperty`
- [ ] `UpdateDto` extiende `PartialType(CreateDto)`
- [ ] Filtros de listado tienen paginación con límites

### Respuestas

- [ ] Status codes correctos por operación
- [ ] Errores usan excepciones nativas de NestJS
- [ ] Campos sensibles excluidos con `@Exclude()`
- [ ] Listas retornan formato `{ data, meta }` con paginación

### Código

- [ ] Sin `console.log` (usar Logger de NestJS)
- [ ] Sin `any` en TypeScript
- [ ] Nombres descriptivos en métodos y variables
- [ ] Métodos privados al final del service

---

## 15. Errores Comunes a Evitar

### Arquitectura

```
❌ Lógica de negocio en el Controller
❌ Acceso directo a PrismaService desde el Controller
❌ Un módulo importando internals de otro módulo (solo Services exportados)
❌ Servicios con estado interno (propiedades que cambian entre requests)
```

### Base de datos

```
❌ DELETE físico en tablas de negocio — siempre soft delete
❌ Múltiples writes sin $transaction (riesgo de inconsistencia)
❌ findMany sin límite de registros en producción
❌ Queries dentro de loops — usar createMany / updateMany
❌ Editar manualmente archivos de migración ya aplicados
```

### Seguridad

```
❌ CORS con origin: '*' en producción
❌ JWT secrets hardcodeados en el código
❌ Passwords logueados o expuestos en respuestas
❌ Stack traces enviados al cliente en errores 500
❌ Rutas sin @Roles() en un sistema con roles
```

### Validación

```
❌ Confiar en datos del cliente sin validar con DTO
❌ whitelist: false en ValidationPipe (permite inyección de campos)
❌ Castear tipos manualmente en lugar de usar transform: true
❌ DTOs sin @ApiProperty (Swagger queda incompleto)
```

### Performance

```
❌ N+1 queries — usar include/select de Prisma correctamente
❌ Cargar relaciones completas cuando solo se necesitan IDs
❌ Sin paginación en endpoints de listado
❌ Caché de datos que cambian frecuentemente con TTL largo
```

---

## Recursos de Referencia

- [NestJS Docs](https://docs.nestjs.com/) — Documentación oficial
- [Prisma Docs](https://www.prisma.io/docs) — ORM y migraciones
- [Fastify Docs](https://fastify.dev/) — Adapter HTTP
- [class-validator](https://github.com/typestack/class-validator) — Validaciones
- [ioredis](https://github.com/redis/ioredis) — Cliente Redis

---

**Mantener esta guía actualizada** cuando:
- Se incorpore una dependencia nueva al stack
- Cambie un patrón de seguridad o autenticación
- Se identifique un error recurrente que deba prevenirse
- Se actualice una versión major de NestJS o Prisma
