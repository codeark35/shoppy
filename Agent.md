# Labscore — Copilot Instructions

> Instrucciones globales para todos los proyectos del equipo Labscore.
> Aplicar siempre como contexto base al generar, revisar o refactorizar código.

---

## 🏢 Identidad del equipo

- **Equipo:** Labscore
- **Mercado:** Paraguay — aplicaciones ERP, POS y web para el mercado local
- **Productos activos:** Ferre-Pro (ERP ferretería), shop-py (ecommerce), Agendify (SaaS scheduling), sistema de restaurante, microservicio de autenticación centralizado

---

## 📦 Política de versiones

> **Regla principal: usar siempre la versión estable más reciente de cada dependencia.**
> Nunca sugerir ni instalar versiones desactualizadas, deprecadas o con EOL próximo.

### Criterios
- **Versión estable más reciente** = la última `@latest` en npm que NO sea `alpha`, `beta`, `rc` o `next`
- Antes de sugerir instalar un paquete, asumir que existe una versión más nueva que la que tenés en memoria de entrenamiento
- Si no sabés la versión exacta actual, indicar `@latest` — nunca hardcodear una versión antigua

### Ejemplos de versiones mínimas de referencia (pueden ser mayores al momento de uso)
| Paquete | Versión mínima de referencia |
|---------|------------------------------|
| Prisma (`@prisma/client` + `prisma`) | **≥ 6.x** (NO usar 4.x ni 5.x en proyectos nuevos) |
| NestJS (`@nestjs/core`) | **≥ 11.x** |
| React | **19.x** |
| Vite | **≥ 6.x** |
| TanStack Query | **v5.x** |
| TypeScript | **≥ 5.x** |
| Node.js | **≥ 20 LTS** (preferir 22 LTS si está disponible) |
| `@nestjs/fastify` / `fastify` | versión compatible con el NestJS instalado |

> ⚠️ **Nunca sugerir Prisma v4 o v5** en proyectos nuevos — usar v6 o superior.
> ⚠️ **Nunca sugerir NestJS v9 o v10** en proyectos nuevos — usar v11 o superior.
> ⚠️ Si el proyecto ya tiene una versión instalada, respetar la que está — no degradar.

### Al generar `package.json` o comandos `npm install`
- Usar `@latest` o el rango `^` con la versión major correcta: `"prisma": "^6"`, `"@nestjs/core": "^11"`
- Nunca escribir versiones como `"prisma": "^4.x.x"` o `"react": "^17"`
- Si hay dudas sobre compatibilidad entre paquetes, mencionarlo explícitamente

---

## 🧱 Stack tecnológico

### Backend
| Capa | Tecnología | Versión mínima |
|------|-----------|----------------|
| Framework | NestJS | v11+ |
| HTTP Adapter | Fastify (NO Express) | compatible con NestJS instalado |
| ORM | Prisma | v6+ |
| Base de datos | PostgreSQL | v15+ |
| Cache / Colas | Redis | v7+ |
| Auth | JWT con RS256 (microservicio centralizado) | — |
| Runtime | Node.js | v20 LTS+ |

### Frontend
| Capa | Tecnología | Versión mínima |
|------|-----------|----------------|
| Framework | React | v19 |
| Build tool | Vite | v6+ |
| Lenguaje | TypeScript | v5+ (strict) |
| UI Library | Bootstrap 5 + react-bootstrap | Bootstrap 5.3+, react-bootstrap 2.x+ |
| Iconos | lucide-react | @latest |
| Data fetching | TanStack Query | v5 |
| HTTP client | Axios | v1.x+ |

> ⚠️ **NO usar Tailwind CSS.** Bootstrap 5 es la única librería de estilos permitida.
> ⚠️ **NO usar Express.** El adapter de NestJS es siempre Fastify.

### Infraestructura / DevOps
| Servicio | Uso |
|----------|-----|
| Railway | Hosting backend (NestJS persistente) |
| Cloudflare Pages | Hosting frontend (React/Vite) |
| Cloudflare Tunnel | Exposición de servicios locales |
| PM2 | Process manager en servidores Ubuntu propios |
| Nginx | Reverse proxy en servidores propios |
| Docker | Desarrollo local y servicios auxiliares |
| WSL2 | Entorno de desarrollo en Windows |

---

## 📁 Estructura de carpetas

### Backend (NestJS)
```
server/
├── src/
│   ├── modules/           # Un módulo por dominio de negocio
│   │   └── {modulo}/
│   │       ├── {modulo}.module.ts
│   │       ├── {modulo}.controller.ts
│   │       ├── {modulo}.service.ts
│   │       ├── dto/
│   │       │   ├── create-{modulo}.dto.ts
│   │       │   └── update-{modulo}.dto.ts
│   │       └── entities/
│   ├── common/            # Guards, decorators, filters, pipes globales
│   │   ├── guards/
│   │   ├── decorators/
│   │   ├── filters/
│   │   └── pipes/
│   ├── prisma/            # PrismaService y PrismaModule
│   ├── config/            # ConfigModule, variables de entorno tipadas
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── test/
└── .env
```

### Frontend (React + Vite)
```
client/
├── src/
│   ├── features/          # Estructura feature-based (un directorio por dominio)
│   │   └── {feature}/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── services/  # llamadas axios
│   │       └── types/
│   ├── shared/            # Componentes y utilidades reutilizables
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   ├── layouts/
│   ├── pages/
│   ├── router/            # React Router
│   ├── store/             # Estado global (Context o Zustand si aplica)
│   ├── lib/               # axios instance, queryClient
│   └── main.tsx
├── public/
└── index.html
```

---

## 🔐 Autenticación

- **Algoritmo:** RS256 (asimétrico) — clave privada solo en el microservicio auth
- **Access token:** JWT de corta duración (15 min)
- **Refresh token:** rotación con detección de reuso por `familyId`
- **Verificación:** híbrida (local con clave pública + validación remota cuando sea necesario)
- **El microservicio auth** es compartido entre todos los proyectos Labscore
- Nunca almacenar tokens en localStorage — usar httpOnly cookies o memoria

---

## 🗄️ Prisma / Base de datos

- Siempre usar `PrismaService` inyectado via DI de NestJS
- Los modelos siguen `camelCase` en Prisma, columnas en `snake_case` con `@map`
- Las migraciones se generan con `prisma migrate dev` — nunca editar archivos de migración manualmente
- Soft delete con campo `deletedAt DateTime?` en entidades que lo requieran
- Timestamps estándar: `createdAt` y `updatedAt` en todos los modelos
- Usar `@db.Decimal` para valores monetarios, nunca `Float`

---

## 📐 Convenciones de código

### NestJS / Backend
- Un módulo por dominio — nunca mezclar lógica de negocio entre módulos
- Lógica de negocio **solo en Services** — Controllers solo reciben y delegan
- DTOs con `class-validator` para toda validación de entrada
- Usar `@nestjs/config` con esquema de validación (Joi o class-validator) para variables de entorno
- Manejo de errores: lanzar `HttpException` o sus subclases (`NotFoundException`, `BadRequestException`, etc.)
- Logging con el `Logger` de NestJS, no `console.log`
- Nunca exponer stack traces en respuestas de producción

### React / Frontend
- Componentes funcionales con hooks — nunca class components
- Custom hooks para lógica reutilizable (`use{Nombre}.ts`)
- TanStack Query para **todo** el estado del servidor (nunca useState para datos remotos)
- Axios instance centralizada con interceptors para auth headers y refresh automático
- Tipado estricto — evitar `any`, tipar siempre las respuestas de API
- Bootstrap clases directamente en JSX, sin CSS-in-JS

---

## 💳 Pagos

- Proveedor: **Bancard VPOS2** (gateway de pagos de Paraguay)
- El módulo de pagos Bancard está implementado como módulo NestJS reutilizable
- Nunca hardcodear credenciales — siempre desde variables de entorno

---

## 🔄 Patrones de arquitectura frecuentes

### Multi-tenancy (Agendify y proyectos SaaS)
- Aislamiento por **Row-Level Isolation** — cada query filtra por `tenantId`
- El `tenantId` se extrae del JWT y se inyecta via middleware/guard en cada request

### State machines
- Estados de entidades críticas (bookings, órdenes) se manejan con **máquinas de estado explícitas**
- Nunca eliminar registros de estado — siempre transicionar (`PENDING → CONFIRMED → COMPLETED`)
- Las transiciones válidas se definen en el Service, no en el Controller

### Event-driven (shop-py)
- Cambios de estado de órdenes emiten eventos via `EventEmitter2`
- Efectos secundarios (notificaciones WhatsApp, emails) se manejan en listeners desacoplados

### Carrito anónimo (shop-py)
- Carrito identificado por `sessionId` en Redis para usuarios no autenticados
- Al hacer login, el carrito anónimo se fusiona con el carrito del usuario

---

## 📱 Notificaciones

- **WhatsApp:** WhatsApp Cloud API (Meta) — módulo NestJS implementado
- n8n como orquestador de flujos de automatización, expuesto via Cloudflare Tunnel
- Confirmaciones de órdenes y recordatorios de turnos via WhatsApp

---

## 🧩 Módulos ERP estándar (Ferre-Pro como referencia)

Los ERPs de Labscore siguen esta estructura modular:

1. **POS** — Punto de venta
2. **Compras** — Gestión de compras a proveedores
3. **Inventario** — Stock con valuación FIFO
4. **Cotizaciones** — Presupuestos y proformas
5. **Devoluciones** — Gestión de devoluciones
6. **CxC** — Cuentas por cobrar
7. **CxP** — Cuentas por pagar
8. **Promociones** — Descuentos y ofertas
9. **Facturación electrónica** — SIFEN / Ekuatia (SET Paraguay)
10. **Tesorería** — Caja y movimientos de dinero
11. **Reportes** — Dashboards y exportaciones
12. **Seguridad** — Roles, permisos y usuarios

---

## 🚀 Deployment

### Flujo estándar
- **Backend:** push a rama `main` → Railway despliega automáticamente
- **Frontend:** push a rama `main` → Cloudflare Pages despliega automáticamente
- Variables de entorno: configuradas en Railway/Cloudflare dashboard, nunca en el repo

### Servidores propios (Ubuntu)
- Stack: Nginx + PM2 + Node.js
- Nginx como reverse proxy hacia el puerto del proceso PM2
- Certificados SSL via Certbot (Let's Encrypt)

---

## ✅ Checklist antes de generar código

1. ¿Está usando Fastify adapter? (no Express)
2. ¿Bootstrap 5 para UI? (no Tailwind)
3. ¿TanStack Query para datos remotos? (no useState/useEffect manual)
4. ¿DTOs con class-validator en todos los endpoints?
5. ¿Valores monetarios con `Decimal` en Prisma?
6. ¿Tokens JWT con RS256?
7. ¿Lógica de negocio en Service, no en Controller?
8. ¿Variables de entorno tipadas con ConfigModule?
9. ¿Las versiones sugeridas son las más recientes estables? (Prisma ≥ v6, NestJS ≥ v11, React 19, Vite ≥ v6)
10. ¿Se usa `@latest` o rango `^` correcto — sin versiones antiguas hardcodeadas?

---

## 🔒 Seguridad & Variables de entorno

### Reglas obligatorias
- **Nunca** commitear archivos `.env`, `.env.local`, `.env.production`
- Todo proyecto debe tener `.env.example` con todas las claves documentadas (sin valores reales)
- `.gitignore` siempre debe incluir: `.env*`, `dist/`, `node_modules/`, `*.log`
- Secrets solo en variables de entorno — nunca hardcodeados en código fuente ni en comentarios

### Variables de entorno estándar (backend)
```env
# App
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379

# Auth (microservicio centralizado)
AUTH_SERVICE_URL=
JWT_PUBLIC_KEY=       # clave pública RS256 en base64

# WhatsApp Cloud API
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
```

### Input validation
- Todo input externo (body, query, params) validado con DTOs + `class-validator`
- Nunca confiar en datos del frontend — revalidar siempre en backend
- Sanitizar strings antes de usarlos en queries dinámicas
- Rate limiting con `@nestjs/throttler` en endpoints públicos y de auth

---

## 📡 Respuestas API — Estructura estándar

Todos los endpoints siguen una estructura de respuesta consistente:

### Éxito — recurso único
```json
{
  "data": { ... },
  "message": "Operación exitosa"
}
```

### Éxito — lista paginada
```json
{
  "data": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Error
```json
{
  "statusCode": 400,
  "message": "Descripción del error legible",
  "error": "Bad Request"
}
```

### Convenciones HTTP
| Acción | Método | Código éxito |
|--------|--------|--------------|
| Obtener lista | `GET /recursos` | `200` |
| Obtener uno | `GET /recursos/:id` | `200` |
| Crear | `POST /recursos` | `201` |
| Actualizar parcial | `PATCH /recursos/:id` | `200` |
| Eliminar | `DELETE /recursos/:id` | `200` o `204` |

- Nunca usar `PUT` para actualizaciones parciales — siempre `PATCH`
- Los IDs en URLs son `cuid` o `uuid` — nunca IDs numéricos autoincrementales expuestos

---

## 🏷️ Naming conventions

### Backend (NestJS / TypeScript)
| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Archivos de módulo | `kebab-case` | `product-category.module.ts` |
| Clases | `PascalCase` | `ProductCategoryService` |
| Variables / funciones | `camelCase` | `findAllByTenant()` |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_RETRY_ATTEMPTS` |
| Enums | `PascalCase` + valores `UPPER_SNAKE_CASE` | `OrderStatus.PENDING` |
| Endpoints REST | `kebab-case` plural | `/product-categories` |
| DTOs | `PascalCase` + sufijo `Dto` | `CreateProductDto` |
| Guards | `PascalCase` + sufijo `Guard` | `JwtAuthGuard` |
| Decoradores | `PascalCase` | `@CurrentUser()` |

### Frontend (React / TypeScript)
| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Componentes | `PascalCase` | `ProductCard.tsx` |
| Hooks | `camelCase` con prefijo `use` | `useProductList.ts` |
| Servicios/API calls | `camelCase` + sufijo `Service` o `Api` | `productService.ts` |
| Tipos/Interfaces | `PascalCase` con prefijo `I` para interfaces (opcional) | `Product`, `IProductResponse` |
| Constantes | `UPPER_SNAKE_CASE` | `API_BASE_URL` |
| CSS classes | Bootstrap nativo — no clases custom salvo que sean necesarias |

### Base de datos (Prisma)
| Elemento | Convención |
|----------|-----------|
| Modelos | `PascalCase` singular | `ProductCategory` |
| Campos en schema | `camelCase` | `createdAt` |
| Columnas en DB | `snake_case` via `@map` | `created_at` |
| Tablas en DB | `snake_case` plural via `@@map` | `product_categories` |

---

## 🌿 Git workflow

### Ramas
```
main          ← producción (protegida, nunca push directo)
develop       ← integración (base para features)
feature/      ← nuevas funcionalidades
fix/          ← corrección de bugs
hotfix/       ← fixes urgentes en producción
chore/        ← tareas técnicas (deps, config, refactor)
```

### Commits — Conventional Commits
```
feat: agregar módulo de devoluciones
fix: corregir cálculo de IVA en facturación
chore: actualizar dependencias a versiones más recientes
refactor: extraer lógica de paginación a helper común
docs: documentar endpoints del módulo de inventario
test: agregar tests unitarios a ProductService
```

### Reglas
- Un commit = un cambio lógico — no mezclar múltiples features en un commit
- Nunca commitear `console.log`, `debugger`, o código comentado
- Nunca commitear `node_modules/`, `dist/`, archivos `.env`
- Mensajes de commit en **español o inglés** — pero consistente dentro del proyecto

---

## ⚡ Performance — Reglas obligatorias

### Backend
- **Toda lista paginada** — nunca devolver arrays sin límite. Paginación con `skip`/`take` en Prisma
- **Índices de base de datos** — definir `@@index` en Prisma para campos usados en `WHERE` frecuentes (`tenantId`, `status`, `deletedAt`, `createdAt`)
- **Evitar N+1** — usar `include` o `select` de Prisma en vez de queries dentro de loops
- **Redis para caché** — cachear respuestas costosas (reportes, dashboards, catálogos grandes)
- **Transacciones Prisma** — usar `prisma.$transaction()` para operaciones que modifican múltiples tablas

```typescript
// ❌ N+1 — nunca así
const orders = await prisma.order.findMany();
for (const order of orders) {
  order.items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
}

// ✅ Correcto
const orders = await prisma.order.findMany({
  include: { items: true }
});
```

### Frontend
- **TanStack Query** maneja caché automático — no duplicar estado en `useState`
- Imágenes con lazy loading — `loading="lazy"` o componente wrapper
- Rutas con `React.lazy()` + `Suspense` para code splitting por módulo
- Evitar re-renders innecesarios — `useMemo` / `useCallback` donde el cálculo sea costoso

---

## 🧪 Testing

### Stack de testing
| Capa | Herramienta |
|------|------------|
| Backend unit | Jest (incluido con NestJS) |
| Backend e2e | Jest + Supertest |
| Frontend unit | Vitest + React Testing Library |

### Qué testear (prioridad)
1. **Services de NestJS** — lógica de negocio crítica (cálculos, transiciones de estado, validaciones)
2. **Guards y Pipes** — seguridad y validación
3. **Hooks de React** — lógica de custom hooks reutilizables
4. **Flujos e2e** — endpoints críticos: auth, facturación, pagos

### Qué NO es prioritario testear
- Controllers (solo delegan — si el Service está testeado, el Controller es trivial)
- Componentes puramente visuales sin lógica

### Convenciones
```typescript
// Archivos de test junto al código que testean
product.service.spec.ts   // unit test
app.e2e-spec.ts           // e2e test

// Estructura de cada test
describe('ProductService', () => {
  describe('create()', () => {
    it('debe crear producto y retornar el registro', async () => { ... });
    it('debe lanzar ConflictException si el SKU ya existe', async () => { ... });
  });
});
```

---

## 🐳 Docker — Desarrollo local

Docker solo para **servicios de infraestructura** — el backend NestJS corre en local directamente.

### `docker-compose.yml` estándar
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: labscore
      POSTGRES_PASSWORD: labscore
      POSTGRES_DB: ${DB_NAME:-app_dev}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Flujo de desarrollo
```bash
# Levantar infraestructura
docker-compose up -d

# Correr backend en local
cd server && npm run start:dev

# Correr frontend en local
cd client && npm run dev
```

---

## 🚫 Prohibiciones explícitas

> El agente NUNCA debe sugerir ni generar lo siguiente:

### Stack
- ❌ Express como adapter de NestJS (siempre Fastify)
- ❌ Tailwind CSS (siempre Bootstrap 5)
- ❌ `useState` + `useEffect` para datos del servidor (siempre TanStack Query)
- ❌ Class components en React
- ❌ `any` en TypeScript sin justificación
- ❌ `Float` en Prisma para dinero (siempre `Decimal`)
- ❌ `localStorage` para tokens JWT

### Seguridad
- ❌ Credenciales o secrets hardcodeados en el código
- ❌ Stack traces expuestos en respuestas de producción
- ❌ Queries con interpolación de strings sin sanitizar
- ❌ Endpoints sin validación de DTOs

### Base de datos
- ❌ Editar archivos de migración manualmente
- ❌ `prisma db push` en producción (solo `prisma migrate deploy`)
- ❌ Eliminar registros críticos (pedidos, facturas, clientes) — siempre soft delete
- ❌ Queries sin filtro de `tenantId` en proyectos multi-tenant

### Performance
- ❌ Endpoints que devuelvan listas sin paginación
- ❌ Queries dentro de loops (N+1)

### Git
- ❌ Push directo a `main`
- ❌ Commitear `node_modules/`, `.env`, `dist/`
- ❌ Commits con mensajes genéricos como `"fix"`, `"update"`, `"wip"`

---

## 🌍 Contexto de negocio — Paraguay

- Moneda: **Guaraní (PYG)** — valores sin decimales en la mayoría de los casos
- Facturación electrónica: **SIFEN** (Sistema Integrado de Facturación Electrónica) via **Ekuatia**
- RUC (Registro Único de Contribuyentes) es el identificador fiscal — validar formato `XXXXXXXX-X`
- Zona horaria: `America/Asuncion` (UTC-4 / UTC-3 en verano)
- Siempre almacenar fechas en UTC en base de datos, convertir a `America/Asuncion` en el cliente

