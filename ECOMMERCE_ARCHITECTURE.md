# ECOMMERCE PLATFORM — Documento de Arquitectura Técnica v1.0
> Marzo 2026 · Paraguay · Equipo Labscore

---

## Stack Tecnológico

### Frontend
- React 18 + Vite 5 + TypeScript 5
- Bootstrap 5 + React-Bootstrap
- Lucide React (iconografía)
- PWA (vite-plugin-pwa + Workbox)
- Zustand (estado global cliente)
- React Query (server state / caché)

### Backend
- NestJS 10 + Fastify
- Prisma ORM + PostgreSQL 16
- Redis 7 (caché + sesiones + colas)
- BullMQ (jobs asincrónicos)
- Bancard VPOS2 (pagos)
- Cloudflare R2 (media/imágenes)

---

## 1. Arquitectura Backend — Monolito Modular NestJS

El modelo adoptado es un **Monolito Modular**: cada dominio de negocio vive en un módulo NestJS completamente aislado. Los módulos se comunican únicamente a través de eventos (EventEmitter2), nunca accediendo directamente a los repositorios de otro módulo. Cuando el volumen lo justifique, cada módulo puede extraerse como microservicio sin cambiar su interfaz pública.

### 1.1 Estructura de Directorios — Backend

```
apps/
  api/                         ← NestJS + Fastify (HTTP)
  worker/                      ← NestJS (procesador BullMQ)
libs/
  prisma/                      ← Prisma client compartido
  redis/                       ← RedisModule compartido
  common/                      ← DTOs, guards, decorators, pipes

apps/api/src/
  modules/
    auth/          ← JWT, refresh tokens, guards
    users/         ← clientes registrados, direcciones
    catalog/       ← productos, categorías, variantes, atributos
    inventory/     ← stock, reservas temporales, alertas
    cart/          ← carrito persistido en Redis (anónimo + autenticado)
    orders/        ← pedidos, máquina de estados, historial
    payments/      ← integración Bancard VPOS2
    shipping/      ← métodos de envío, zonas, costos
    promotions/    ← cupones, descuentos, reglas
    notifications/ ← emails (Resend), push (FCM/VAPID)
    media/         ← upload a Cloudflare R2
    admin/         ← panel de administración
    reports/       ← analytics, dashboards
  shared/
    events/        ← EventEmitter2 (comunicación interna entre módulos)
    filters/       ← exception filters globales
    interceptors/  ← logging, transform response
```

### 1.2 Módulos del Sistema

| Módulo        | Responsabilidad                                                        | Fase   | Prioridad |
|---------------|------------------------------------------------------------------------|--------|-----------|
| auth          | Registro, login, JWT + refresh token, OAuth2 (Google)                 | Fase 1 | Alta      |
| catalog       | Productos, categorías, variantes (talle/color), atributos, slugs      | Fase 1 | Alta      |
| inventory     | Stock en tiempo real, reservas temporales, alertas de bajo stock      | Fase 1 | Alta      |
| cart          | Carrito en Redis con TTL, carrito anónimo, merge post-login           | Fase 1 | Alta      |
| orders        | Ciclo completo: PENDING → PAID → PREPARING → SHIPPED → DELIVERED      | Fase 1 | Alta      |
| payments      | Bancard VPOS2: single buy, confirmación webhook, reversa              | Fase 1 | Alta      |
| users         | Perfil de cliente, múltiples direcciones, wishlist                    | Fase 1 | Alta      |
| media         | Upload de imágenes a Cloudflare R2, optimización, CDN URLs            | Fase 1 | Alta      |
| shipping      | Zonas de envío, tarifas planas, integración futura con operadores     | Fase 2 | Media     |
| promotions    | Cupones de descuento, porcentaje o monto fijo                         | Fase 2 | Media     |
| notifications | Emails transaccionales (Resend), push notifications (FCM/VAPID)      | Fase 2 | Media     |
| reviews       | Reseñas y calificaciones de productos, moderación                    | Fase 3 | Baja      |
| reports       | Ventas por período, productos top, clientes recurrentes, CSV          | Fase 3 | Baja      |

### 1.3 Estrategia de Caché con Redis

| Rol                | Detalles                                                                 |
|--------------------|--------------------------------------------------------------------------|
| Carrito anónimo    | Hash por sessionId cookie — TTL 30 días. Persiste sin login.            |
| Carrito autenticado| Hash por userId — TTL 7 días. Merge automático al loguear.              |
| Catálogo           | Cache-aside — TTL 15 min. Invalidación al editar producto en admin.     |
| Sesiones de pago   | Token Bancard — TTL 30 min. Auto-expirado por Redis.                    |
| Rate limiting      | Sliding window por IP/userId en login, checkout.                        |
| Colas BullMQ       | Jobs para emails, push notifications, reportes asincrónicos.            |
| Stock reservado    | Reserva temporal durante checkout — TTL 15 min (evita overselling).     |

---

## 2. Carrito Anónimo — Flujo Completo

Esta es una de las decisiones de UX más importantes: **no se requiere login para agregar al carrito**. El login se pide únicamente al iniciar el checkout.

### Flujo

```
Usuario visita la tienda (sin login)
  → agrega productos
    → sessionId anónimo generado automáticamente (cookie HttpOnly)
      → carrito guardado en Redis: cart:anon_{sessionId}  (TTL 30 días)
        → usuario hace clic en "Finalizar compra"
          → se pide login o registro
            → al autenticarse: MERGE automático del carrito anónimo → carrito del userId
              → cart:anon_{sessionId}  +  cart:{userId}  →  cart:{userId}
                → carrito anónimo eliminado de Redis
                  → usuario continúa el checkout sin perder nada
```

### Regla de merge
Si el mismo producto estaba en ambos carritos, se suman las cantidades (o se toma la mayor — definir según negocio).

---

## 3. Módulo Orders — Máquina de Estados

El módulo `orders` es el núcleo que conecta todos los módulos. Es el **dueño del estado** de la compra de principio a fin.

### Estados

```
PENDING
  → PAYMENT_PROCESSING
    → PAID
      → PREPARING        ← el depósito recibe la orden aquí
        → READY_TO_SHIP
          → SHIPPED
            → DELIVERED
              → COMPLETED

En cualquier punto → CANCELLED | REFUNDED
```

### Qué ocurre en cada transición

| Transición                        | Quién actúa              | Efecto                                                       |
|-----------------------------------|--------------------------|--------------------------------------------------------------|
| PENDING → PAYMENT_PROCESSING      | Usuario confirma carrito | Orden creada, usuario redirigido a Bancard                   |
| PAYMENT_PROCESSING → PAID         | Webhook Bancard          | Stock descontado, email confirmación al cliente              |
| PAID → PREPARING                  | Admin/depósito           | Orden aparece en panel del depósito                          |
| PREPARING → READY_TO_SHIP         | Depósito confirma        | Pedido empaquetado                                           |
| READY_TO_SHIP → SHIPPED           | Operador logístico       | Email al cliente con número de seguimiento                   |
| SHIPPED → DELIVERED               | Confirmación manual/auto | Email de entrega, orden completada                           |

### Comunicación entre módulos via eventos (sin acoplamiento directo)

```typescript
// orders.service.ts — emite evento al confirmarse el pago
this.eventEmitter.emit('order.paid', { orderId, userId, items })

// inventory.service.ts — escucha y descuenta stock real
@OnEvent('order.paid')
async handleOrderPaid(payload) { ... }

// notifications.service.ts — escucha y manda email de confirmación
@OnEvent('order.paid')
async sendConfirmationEmail(payload) { ... }
```

`orders` no importa ni conoce a `inventory` ni `notifications`. Fronteras limpias.

---

## 4. Integración Bancard VPOS2

### Flujo de pago

| Paso | Actor    | Descripción                                                               |
|------|----------|---------------------------------------------------------------------------|
| 1    | Frontend | Usuario confirma carrito → llama POST /payments/initiate con orderId     |
| 2    | Backend  | Genera token HMAC-SHA256, llama a Bancard single_buy API                 |
| 3    | Frontend | Redirige al usuario a la URL segura de Bancard con process_id            |
| 4    | Bancard  | Usuario ingresa datos de tarjeta en entorno seguro de Bancard            |
| 5    | Bancard  | Notifica al backend via webhook POST /payments/webhook con resultado     |
| 6    | Backend  | Valida firma HMAC, actualiza orden a PAID, emite evento order.paid       |
| 7    | Frontend | Usuario regresa al sitio con estado de éxito o error                     |

### Reglas críticas de seguridad
- El token se genera con HMAC-SHA256 usando `shop_process_id + secret_key`
- **Nunca** procesar el redirect del usuario como confirmación — siempre esperar el webhook
- Validar la firma del webhook antes de cualquier cambio de estado
- Implementar idempotencia en el webhook para evitar doble procesamiento
- Los tokens de Bancard se almacenan en Redis con TTL 30 minutos

---

## 5. Arquitectura Frontend — Feature-Based

La estructura sigue el patrón **Feature-Based**: todo lo que pertenece a una feature vive junto (componentes, hooks, servicios, tipos, store). Los módulos se comunican únicamente a través de `shared` o stores globales — nunca una feature importa directamente de otra.

### Regla de dependencias
```
pages     →  puede importar de features y shared
features  →  puede importar de shared únicamente
shared    →  no importa de nadie interno
```

### Estructura de directorios — Frontend

```
src/
  features/
    auth/
      components/     LoginModal, RegisterForm
      hooks/          useAuth.ts, useSession.ts
      services/       auth.service.ts
      store/          authStore.ts        ← Zustand
      types/          auth.types.ts
      index.ts        ← barrel export público

    catalog/
      components/     ProductCard, ProductGrid, FilterSidebar, CategoryNav
      hooks/          useProducts.ts, useFilters.ts, useProductDetail.ts
      services/       catalog.service.ts
      types/          catalog.types.ts
      index.ts

    cart/
      components/     CartDrawer, CartItem, MiniCart, CartSummary
      hooks/          useCart.ts, useCartSync.ts, useCartMerge.ts
      services/       cart.service.ts
      store/          cartStore.ts        ← Zustand
      types/          cart.types.ts
      index.ts

    checkout/
      components/     AddressForm, ShippingSelector, OrderSummary, PaymentRedirect
      hooks/          useCheckout.ts, useShipping.ts
      services/       checkout.service.ts
      types/          checkout.types.ts
      index.ts

    orders/
      components/     OrderList, OrderDetail, OrderStatusBadge, OrderTimeline
      hooks/          useOrders.ts, useOrderDetail.ts
      services/       orders.service.ts
      types/          orders.types.ts
      index.ts

    account/
      components/     ProfileForm, AddressManager, Wishlist
      hooks/          useProfile.ts, useAddresses.ts
      services/       account.service.ts
      types/          account.types.ts
      index.ts

  shared/
    components/       Button, Badge, Card, Modal, Spinner, EmptyState
    hooks/            useDebounce.ts, usePagination.ts, useLocalStorage.ts, usePWA.ts
    lib/
      api.ts          ← axios instance con interceptors JWT
      queryClient.ts  ← React Query config global
    types/            tipos globales (ApiResponse, PaginatedResult, etc.)
    utils/            formatPrice.ts, formatDate.ts, slugify.ts

  pages/              ← solo ensamblado, sin lógica propia
    HomePage.tsx
    CatalogPage.tsx
    ProductPage.tsx
    CartPage.tsx
    CheckoutPage.tsx
    OrdersPage.tsx
    AccountPage.tsx

  app/
    App.tsx
    router.tsx
    providers.tsx     ← QueryClientProvider, AuthProvider, PWAProvider
```

### Layout mobile-first (PWA)
- **Mobile (< 768px):** Bottom Navigation fija — Inicio · Catálogo · Carrito · Cuenta
- **Desktop:** Navbar superior clásico con Bootstrap
- El carrito se muestra como Offcanvas drawer en ambas resoluciones
- Los filtros del catálogo usan Offcanvas en mobile para mejor UX táctil

---

## 6. Configuración PWA — Vite

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        runtimeCaching: [
          {
            urlPattern: /\/api\/catalog/,
            handler: 'StaleWhileRevalidate',   // catálogo disponible offline
            options: {
              cacheName: 'catalog-cache',
              expiration: { maxAgeSeconds: 86400 }
            }
          },
          {
            urlPattern: /\/api\/cart/,
            handler: 'NetworkFirst',           // carrito siempre fresco
          }
        ]
      },
      manifest: {
        name: 'Mi Tienda',
        short_name: 'Tienda',
        theme_color: '#1A56DB',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
```

---

## 7. Schema Prisma — Entidades Principales

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  name          String
  phone         String?
  role          Role      @default(CUSTOMER)
  addresses     Address[]
  orders        Order[]
  createdAt     DateTime  @default(now())
}

model Category {
  id        String     @id @default(cuid())
  name      String
  slug      String     @unique
  parentId  String?
  parent    Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children  Category[] @relation("CategoryTree")
  products  Product[]
}

model Product {
  id          String           @id @default(cuid())
  slug        String           @unique
  name        String
  description String
  basePrice   Decimal          @db.Decimal(10,2)
  images      ProductImage[]
  variants    ProductVariant[]
  category    Category         @relation(fields: [categoryId], references: [id])
  categoryId  String
  isActive    Boolean          @default(true)
  createdAt   DateTime         @default(now())
}

model ProductVariant {
  id         String   @id @default(cuid())
  product    Product  @relation(fields: [productId], references: [id])
  productId  String
  sku        String   @unique
  attributes Json     // { "color": "Rojo", "talle": "M" }
  price      Decimal  @db.Decimal(10,2)
  stock      Int      @default(0)
}

model Order {
  id          String      @id @default(cuid())
  user        User        @relation(fields: [userId], references: [id])
  userId      String
  status      OrderStatus @default(PENDING)
  items       OrderItem[]
  payment     Payment?
  shipping    OrderShipping?
  total       Decimal     @db.Decimal(10,2)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model OrderItem {
  id        String  @id @default(cuid())
  order     Order   @relation(fields: [orderId], references: [id])
  orderId   String
  variantId String
  name      String  // snapshot del nombre al momento de compra
  price     Decimal @db.Decimal(10,2) // snapshot del precio
  quantity  Int
}

model Payment {
  id              String        @id @default(cuid())
  order           Order         @relation(fields: [orderId], references: [id])
  orderId         String        @unique
  provider        String        @default("bancard")
  shopProcessId   String        @unique
  status          PaymentStatus @default(PENDING)
  amount          Decimal       @db.Decimal(10,2)
  confirmedAt     DateTime?
  createdAt       DateTime      @default(now())
}

enum Role {
  CUSTOMER
  ADMIN
  WAREHOUSE  // personal de depósito
}

enum OrderStatus {
  PENDING
  PAYMENT_PROCESSING
  PAID
  PREPARING
  READY_TO_SHIP
  SHIPPED
  DELIVERED
  COMPLETED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  APPROVED
  REJECTED
  REVERSED
}
```

---

## 8. Variables de Entorno

```env
# DATABASE
DATABASE_URL="postgresql://user:pass@host:5432/ecommerce"

# REDIS
REDIS_URL="redis://default:pass@host:6379"

# JWT
JWT_SECRET="[min 32 chars random]"
JWT_REFRESH_SECRET="[min 32 chars random]"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# BANCARD
BANCARD_ENV="sandbox"           # sandbox | production
BANCARD_PUBLIC_KEY="..."
BANCARD_PRIVATE_KEY="..."
BANCARD_BASE_URL="https://vpos.infonet.com.py"
BANCARD_RETURN_URL="https://tutienda.com.py/checkout/result"

# CLOUDFLARE R2
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="ecommerce-media"
R2_PUBLIC_URL="https://media.tutienda.com.py"

# RESEND (emails transaccionales)
RESEND_API_KEY="re_..."
RESEND_FROM="noreply@tutienda.com.py"

# FCM (push notifications)
FCM_PROJECT_ID="..."
FCM_PRIVATE_KEY="..."
FCM_CLIENT_EMAIL="..."

# APP
PORT=3000
FRONTEND_URL="https://tutienda.com.py"
NODE_ENV="production"
```

---

## 9. Infraestructura de Deploy

| Servicio            | Plataforma               | Notas                                      |
|---------------------|--------------------------|--------------------------------------------|
| API NestJS          | Railway                  | Servicio persistente                       |
| Worker BullMQ       | Railway                  | Servicio separado en el mismo proyecto     |
| PostgreSQL          | Railway PostgreSQL        | Backups diarios en plan Pro                |
| Redis               | Railway Redis / Upstash  | Upstash para capa gratuita inicial         |
| Frontend PWA        | Cloudflare Pages         | CDN global, deploy desde Git               |
| Media / Imágenes    | Cloudflare R2            | S3-compatible, sin costo de egress         |
| Dominio / SSL       | Cloudflare DNS           | SSL automático                             |
| Emails              | Resend                   | 3000 emails/mes gratis                     |
| Push Notifications  | FCM + VAPID              | FCM Android, VAPID iOS/Desktop             |

---

## 10. Roadmap de Implementación

### Orden estricto recomendado — no saltear fases

| Fase   | Duración | Entregables                                                                      | Stack activado                        |
|--------|----------|----------------------------------------------------------------------------------|---------------------------------------|
| Fase 1 | 6–8 sem  | Auth, Catálogo, Carrito anónimo+merge, Checkout, Pagos Bancard, Admin, PWA base | NestJS + Prisma + Redis + React + PWA |
| Fase 2 | 4–5 sem  | Push/email notifications, Cupones, Envíos con zonas, Reviews, Wishlist          | + BullMQ + FCM + Resend               |
| Fase 3 | 4–6 sem  | Dashboard analytics, Reportes CSV, Búsqueda avanzada, Recomendaciones           | + Meilisearch + Chart.js              |
| Fase 4 | On demand| Multi-depósito, B2B precios por cliente, API pública, extracción microservicios  | Microservicios + API Gateway          |

### Por qué este orden
- **Auth primero**: sin autenticación nada más funciona
- **Catálogo antes que carrito**: el carrito necesita productos reales
- **Carrito anónimo desde el día 1**: implementarlo después requiere refactoring costoso
- **Bancard en Fase 1**: es el core del negocio, no es opcional
- **PWA config al final de Fase 1**: se agrega sobre el frontend ya funcional

---

## 11. Checklist de Seguridad

| Item                  | Implementación                                                          |
|-----------------------|-------------------------------------------------------------------------|
| Autenticación         | JWT access token (15min) + refresh token (7 días) en HttpOnly cookie   |
| Contraseñas           | bcrypt con salt rounds = 12                                             |
| Rate limiting         | ThrottlerModule NestJS + Redis sliding window en endpoints críticos     |
| CORS                  | Whitelist estricta — solo el dominio del frontend                       |
| Input validation      | class-validator + class-transformer en todos los DTOs                  |
| SQL injection         | Prisma ORM — queries parametrizadas siempre                            |
| XSS                   | React escapa por defecto + Helmet para security headers                |
| Webhook Bancard       | Validación de firma HMAC antes de procesar cualquier cambio de estado  |
| Secrets               | Variables de entorno — jamás en el código fuente                       |
| HTTPS                 | Forzado en producción — Cloudflare SSL frontend, Railway API           |
| Dependencias          | npm audit en CI/CD + Dependabot para actualizaciones automáticas       |
| Idempotencia webhooks | Guardar shopProcessId procesados para evitar doble procesamiento       |

---

*Fin del documento — Equipo Labscore · Confidencial*
