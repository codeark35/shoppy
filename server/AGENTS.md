# Backend — Ecommerce API

NestJS 11 + Fastify + Prisma 6 + PostgreSQL + Redis.

## Comandos

```bash
npm run start:dev    # Dev en :3070 con hot-reload
npm run lint         # ESLint
npx prisma migrate dev --name <desc>  # Migraciones
npx prisma studio    # UI para ver datos
```

## Estructura

```
src/
├── main.ts                    # Bootstrap Fastify + pipes + Swagger + CORS
├── app.module.ts              # Módulo raíz
├── config/                    # app.config, database.config, jwt.config, redis.config
├── common/                    # decorators (@CurrentUser, @Roles, @Public), filters, guards, interceptors, pipes, types
├── prisma/                    # prisma.service.ts (PrismaClient singleton con paginate helper)
└── modules/                   # auth, users, products, customers, sales, etc.
    └── [module]/
        ├── [module].module.ts
        ├── [module].controller.ts  # Solo recibe, delega, responde
        ├── [module].service.ts     # Lógica de negocio
        ├── dto/                    # create-, update-, filter-*.dto (class-validator + @ApiProperty)
        └── entities/
```

## Dependencias entre capas

```
modules → common, prisma, config
common  → config
config  → nada (no importa modules ni common)
```

- Un módulo NUNCA importa de otro módulo directamente — usa Services exportados

## DB (Prisma)

- Toda tabla: `id` (cuid), `createdAt`, `updatedAt`, `isActive`, `deletedAt`
- Soft delete siempre (nunca DELETE físico)
- Operaciones multi-tabla con `$transaction`
- Nombres tabla snake_case vía `@@map`, campos camelCase en schema
- Migraciones: `prisma migrate dev` en dev, `prisma migrate deploy` en prod

## Auth

- JWT RS256 (access 15min + refresh 7d en Redis)
- Guards globales: `JwtAuthGuard` + `RolesGuard` en AppModule
- `@Public()` para rutas sin auth, `@Roles('admin')` para permisos
- Rate limiting estricto en endpoints de auth (5 req/min)

## Respuestas HTTP

| Operación | Status |
|---|---|
| GET (lista/detalle) | 200 |
| POST | 201 |
| PATCH/PUT | 200 |
| DELETE | 204 (soft delete) |
| Error validación | 400 |
| No auth | 401 |
| Sin permiso | 403 |
| No encontrado | 404 |
| Conflicto | 409 |

## Reglas clave

- Controller sin lógica de negocio — solo delega a Service
- Service sin acceso a request/response HTTP
- DTOs con whitelist + forbidNonWhitelisted + transform en ValidationPipe
- Sin `any`, sin `console.log` (usar Logger de NestJS)
- Nunca loguear passwords, tokens ni datos sensibles
- bcrypt rounds mínimo 12
