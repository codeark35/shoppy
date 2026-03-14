# CHECKLIST DE FASES — Ecommerce Platform
> Labscore · Marzo 2026

---

## ✅ FASE 1 — Core (Auth · Catálogo · Carrito · Checkout · Pagos · Admin · PWA)

### Backend

#### Módulo `auth`
- [x] Registro de usuario (email + contraseña bcrypt)
- [x] Login con JWT access token (15 min) + refresh token (7 días HttpOnly cookie)
- [x] Guard `JwtAuthGuard` + decorador `@CurrentUser`
- [x] Guard `RolesGuard` + decorador `@Roles`
- [x] Estrategia JWT refresh

#### Módulo `users`
- [x] `GET /users/me` — perfil del usuario
- [x] `PATCH /users/me` — actualizar nombre y teléfono
- [x] `GET /users/me/addresses` — listar direcciones
- [x] `POST /users/me/addresses` — crear dirección
- [x] `DELETE /users/me/addresses/:id` — eliminar dirección

#### Módulo `catalog`
- [x] CRUD de categorías con árbol padre/hijo
- [x] CRUD de productos con variantes y atributos (JSON)
- [x] Upload de imágenes a Cloudflare R2
- [x] `GET /catalog/products` con filtros (categoría, precio, búsqueda)
- [x] `GET /catalog/products/:slug` — detalle de producto
- [x] Slugs únicos autogenerados

#### Módulo `inventory`
- [x] Control de stock por variante
- [x] Reserva temporal en Redis (TTL 15 min) al iniciar checkout
- [x] Descuento de stock real al confirmarse pago (evento `order.paid`)
- [x] Alertas de bajo stock

#### Módulo `cart`
- [x] Carrito anónimo persistido en Redis (`cart:anon_{sessionId}`) — TTL 30 días
- [x] Carrito autenticado en Redis (`cart:user:{userId}`) — TTL 7 días
- [x] Merge automático al iniciar sesión
- [x] `GET/POST/DELETE /cart/items`

#### Módulo `orders`
- [x] Máquina de estados: PENDING → PAYMENT_PROCESSING → PAID → PREPARING → READY_TO_SHIP → SHIPPED → DELIVERED → COMPLETED
- [x] Cancelación y reversa en cualquier punto
- [x] `POST /orders` — crear orden desde carrito
- [x] `GET /orders` — historial del usuario
- [x] `GET /orders/:id` — detalle de orden
- [x] `PATCH /orders/:id/status` — cambio de estado (admin/warehouse)
- [x] Emisión de evento `order.paid` al confirmar pago

#### Módulo `payments`
- [x] Integración Bancard VPOS2
- [x] `POST /payments/initiate` — inicia pago, devuelve URL Bancard
- [x] `POST /payments/webhook` — recibe confirmación, valida firma HMAC-SHA256
- [x] Idempotencia: `shopProcessId` único para evitar doble procesamiento
- [x] Token Bancard almacenado en Redis con TTL 30 min

#### Módulo `media`
- [x] Upload a Cloudflare R2 (S3-compatible)
- [x] URLs públicas via CDN

#### Módulo `admin`
- [x] Panel de gestión de productos y categorías
- [x] Panel de gestión de órdenes
- [x] Panel de gestión de usuarios
- [x] Panel de inventario / stock

#### Infraestructura
- [x] NestJS 10 + Fastify
- [x] Prisma ORM con PostgreSQL 16
- [x] Redis 7 (caché + sesiones + colas)
- [x] BullMQ (worker separado)
- [x] ThrottlerModule (rate limiting)
- [x] GlobalExceptionFilter
- [x] EventEmitter2 para comunicación entre módulos
- [x] Variables de entorno configuradas

### Frontend

#### Diseño
- [x] Bootstrap 5 + React-Bootstrap
- [x] SCSS con sistema de diseño (Sora + DM Sans, `#0F4C81` primario, `#F97316` acento)
- [x] `_variables.scss` — overrides Bootstrap
- [x] `_components.scss` — `.product-card`, `.btn-accent`, `.skeleton`, `.shipping-option`, etc.
- [x] Google Fonts (Sora + DM Sans) en `index.html`

#### Feature `auth`
- [x] `LoginModal` — login y registro
- [x] `authStore` (Zustand + persistencia)
- [x] Interceptor axios con JWT y refresh automático

#### Feature `catalog`
- [x] `ProductCard` — imagen 1:1, badge descuento, botón wishlist, `.btn-accent`
- [x] `ProductGrid` — grid responsivo
- [x] `FilterSidebar` — filtros por categoría/precio (Offcanvas en mobile)
- [x] `CategoryNav` — navegación de categorías
- [x] `useProducts` hook (React Query)

#### Feature `cart`
- [x] `cartStore` (Zustand)
- [x] `CartDrawer` — Offcanvas lateral
- [x] `MiniCart` — indicador en navbar

#### Feature `checkout`
- [x] `CheckoutPage` — formulario de envío completo (nombre, teléfono, dirección)
- [x] Integración con Bancard (redirección)

#### Feature `orders`
- [x] `OrderList` — historial
- [x] `OrderDetail` — detalle con timeline
- [x] `OrderStatusBadge` — badge por estado
- [x] `OrderTimeline` — progreso visual

#### Feature `account`
- [x] `AddressManager` — CRUD de direcciones
- [x] `AccountPage` — datos personales

#### PWA
- [x] `vite-plugin-pwa` configurado
- [x] Service Worker con estrategias Workbox (catálogo offline, carrito network-first)
- [x] `manifest.json` (nombre, iconos, `theme_color`, `standalone`)
- [x] Meta tags PWA en `index.html` (`theme-color`, `apple-mobile-web-app`)

#### Páginas
- [x] `HomePage`
- [x] `CatalogPage`
- [x] `ProductPage`
- [x] `CartPage`
- [x] `CheckoutPage`
- [x] `OrdersPage`
- [x] `AccountPage`

---

## ✅ FASE 2 — Notificaciones · Cupones · Envíos · Reviews · Wishlist

### Backend

#### Módulo `shipping`
- [x] Modelo `ShippingZone` (zonas con array de departamentos)
- [x] Modelo `ShippingRate` (tarifas por zona)
- [x] `GET /shipping/zones` — zonas activas con tarifas
- [x] `GET /shipping/rates?department=X` — tarifas para un departamento
- [x] Admin: `POST /shipping/zones`, `POST /shipping/rates`
- [x] Admin: `PATCH /shipping/zones/:id/toggle`, `PATCH /shipping/rates/:id/toggle`

#### Módulo `promotions`
- [x] Modelo `Coupon` (PERCENTAGE | FIXED, validez, límite de usos)
- [x] `POST /promotions/validate` — valida cupón con subtotal, devuelve descuento
- [x] Admin: `GET /promotions/coupons`, `POST /promotions/coupons`
- [x] Admin: `PATCH /promotions/coupons/:id/toggle`
- [x] Incremento automático de `usedCount` al crear orden

#### Módulo `notifications`
- [x] Modelo `PushSubscription` (endpoint VAPID por usuario)
- [x] Integración **Resend** SDK para emails transaccionales
- [x] Integración **web-push** para notificaciones VAPID
- [x] Worker `NotificationProcessor`: `send-email` (Resend) + `send-push` (web-push)
- [x] Limpieza automática de suscripciones expiradas (HTTP 410/404)
- [x] Template HTML de email (confirmación de orden)
- [x] `POST /notifications/push/subscribe`
- [x] `DELETE /notifications/push/unsubscribe`

#### Módulo `reviews`
- [x] Modelo `Review` (rating 1–5, comentario, aprobación)
- [x] Constraint único `userId + productId`
- [x] `GET /reviews/product/:productId` — reseñas aprobadas + promedio
- [x] `POST /reviews` — crear reseña (autenticado)
- [x] Admin: `GET /reviews/pending`, `PATCH /reviews/:id/approve`, `DELETE /reviews/:id`

#### Actualizaciones Fase 2
- [x] `OrdersService`: soporte `couponCode` + `shippingRateId` en `createFromCart`
- [x] `OrdersShipping`: campos `recipientName`, `phone`, `country`, `zipCode`, `shippingRateId`
- [x] `Order`: campos `orderNumber`, `couponId`, `discountAmount`
- [x] `UsersService`: `getWishlist`, `addToWishlist`, `removeFromWishlist`
- [x] `UsersController`: `GET/POST/DELETE /users/me/wishlist/:productId`
- [x] `app.module.ts`: registrados `ShippingModule`, `PromotionsModule`, `NotificationsModule`, `ReviewsModule`
- [x] `prisma generate` ejecutado exitosamente (v6.19.2)

#### Variables de entorno Fase 2
- [x] `RESEND_API_KEY`
- [x] `RESEND_FROM`
- [x] `VAPID_PUBLIC_KEY`
- [x] `VAPID_PRIVATE_KEY`
- [x] `VAPID_SUBJECT`

### Frontend

#### Feature `wishlist`
- [x] `wishlist.types.ts`
- [x] `wishlist.service.ts` (`GET/POST/DELETE /users/me/wishlist/:productId`)
- [x] `useWishlist` hook (React Query, `Set<string>` de IDs, `toggleWishlist`)
- [x] `barrel index.ts`

#### Feature `reviews`
- [x] `reviews.types.ts`
- [x] `reviews.service.ts`
- [x] `useReviews` hook (React Query)
- [x] `StarRating` componente (interactivo o solo lectura)
- [x] `ReviewList` componente (promedio + lista)
- [x] `ReviewForm` componente (selección de estrellas + comentario)
- [x] `barrel index.ts`

#### `ProductCard` — rediseño
- [x] Imagen con `aspect-ratio: 1/1`
- [x] Badge de descuento (top-left, porcentaje calculado vs `basePrice`)
- [x] Botón wishlist (top-right, corazón, activo en rojo)
- [x] CTA botón `.btn-accent` (naranja)
- [x] Categoría en gris pequeño
- [x] Nombre con `font-family: Sora`, `line-clamp: 2`
- [x] Precio tachado cuando hay descuento

#### `CartPage` — cupones
- [x] Input de código cupón con botón "Aplicar"
- [x] Validación en tiempo real via `POST /promotions/validate`
- [x] Línea de descuento en el resumen
- [x] Cupón pasado a CheckoutPage via `router.state`

#### `CheckoutPage` — envíos
- [x] `ShippingSelector` integrado (carga tarifas por departamento con debounce 500ms)
- [x] Muestra precio y días estimados de cada tarifa
- [x] `shippingRateId` incluido en el DTO al crear orden
- [x] Descuento de cupón visible en resumen de orden
- [x] Total final = subtotal − descuento + envío

#### `AccountPage` — push notifications
- [x] Detección de soporte (`serviceWorker` + `PushManager`)
- [x] Botón activar/desactivar notificaciones push
- [x] Suscripción via VAPID al SW registrado
- [x] `POST /notifications/push/subscribe` al activar
- [x] `DELETE /notifications/push/unsubscribe` al desactivar
- [x] Detección del estado actual al cargar la página

#### Variables de entorno Fase 2 (cliente)
- [x] `VITE_VAPID_PUBLIC_KEY`

---

## ✅ FASE 3 — Analytics · Búsqueda · Reportes [COMPLETADA]

### Backend

#### Módulo `reports`
- [x] Ventas por período con rango de fechas libre
- [x] `GET /reports/overview` — KPIs (ingresos, órdenes, clientes, ticket promedio)
- [x] `GET /reports/sales` — ingresos y órdenes agrupados por día
- [x] `GET /reports/top-products` — productos más vendidos (top N configurable)
- [x] `GET /reports/customers` — clientes nuevos y únicos con órdenes
- [x] `GET /reports/sales/csv` — descarga CSV de ventas
- [x] `GET /reports/top-products/csv` — descarga CSV de top productos
- [x] Protegidos con `@Roles(Role.ADMIN)`

#### Búsqueda (`SearchModule`)
- [x] `GET /search?q=&categorySlug=&minPrice=&maxPrice=&page=&limit=` — búsqueda full-text
- [x] Integración Meilisearch (con fallback automático a Prisma ILIKE si no está configurado)
- [x] `POST /search/reindex` — reindexar todos los productos en Meilisearch (admin)
- [x] `meilisearch@0.55.0` instalado
- [x] `MEILISEARCH_HOST` y `MEILISEARCH_API_KEY` en `.env.example`

#### Módulo `recommendations`
- [x] `GET /recommendations/products/:productId` — productos relacionados por categoría
- [x] `GET /recommendations/products/:productId/frequently-bought` — comprados juntos (historial de órdenes + fallback)

### Frontend

#### Feature `analytics`
- [x] `analytics.types.ts` — `SalesOverview`, `SalesByDay`, `TopProduct`, `CustomerReport`
- [x] `analytics.service.ts` — llamadas a todos los endpoints `/reports/*`
- [x] `useAnalyticsOverview`, `useAnalyticsSales`, `useAnalyticsTopProducts`, `useAnalyticsCustomers` hooks (React Query)
- [x] `barrel index.ts`

#### `AdminDashboardPage`
- [x] Selector de período (7 / 30 / 90 días)
- [x] 4 KPI cards (ingresos, órdenes, nuevos clientes, clientes activos)
- [x] Gráfico de ingresos por día — `Line` (Chart.js)
- [x] Gráfico de órdenes por día — `Bar` (Chart.js)
- [x] Tabla de top productos con posición
- [x] Botones de descarga CSV (ventas + top productos)
- [x] Ruta `/admin/dashboard`, visible solo para `role = ADMIN` en AppNavbar
- [x] `chart.js@4.5.1` + `react-chartjs-2@5.3.1` instalados

#### Feature `search`
- [x] `search.types.ts` — `SearchFilters`, `SearchResult`
- [x] `search.service.ts` — `GET /search`
- [x] `useSearch` hook (React Query, enabled con q > 1 char)
- [x] `SearchBar` componente — autocomplete dropdown con suggencias
- [x] `barrel index.ts`

#### `SearchPage` (`/buscar`)
- [x] Filtros de precio en sidebar (5 rangos)
- [x] Grid de resultados 2–5 columnas responsivo
- [x] Paginación
- [x] Estado vacío con mensaje

#### Actualizaciones
- [x] `AppNavbar` — `SearchBar` integrada (visible en desktop)
- [x] `AppNavbar` — botón "Dashboard" visible para admin
- [x] `router.tsx` — rutas `/buscar` y `/admin/dashboard` (lazy loaded)

#### Variables de entorno Fase 3
- [ ] `MEILISEARCH_HOST` (ej: `http://localhost:7700` o instancia cloud)
- [ ] `MEILISEARCH_API_KEY`

---

## ⬜ FASE 4 — Escalabilidad · B2B · API Pública

### Arquitectura
- [ ] Extracción de módulos como microservicios (API Gateway + gRPC/REST)
- [ ] Multi-depósito (inventario por ubicación)
- [ ] Multi-moneda (soporte USD + PYG)
- [ ] Multi-idioma (i18n)

### B2B
- [ ] Precios por cliente o lista de precios
- [ ] Crédito y facturación mensual
- [ ] Aprobación de órdenes por monto
- [ ] Portal de cliente B2B separado

### API Pública
- [ ] API REST pública con autenticación API Key
- [ ] Documentación Swagger/OpenAPI
- [ ] Rate limiting por API Key
- [ ] Webhooks configurables para integraciones externas

---

## Seguridad — Checklist Transversal

- [x] JWT access + refresh token en HttpOnly cookie
- [x] bcrypt (salt rounds = 12)
- [x] ThrottlerModule — rate limiting por IP/userId
- [x] CORS — whitelist estricta del dominio frontend
- [x] `class-validator` + `class-transformer` en todos los DTOs
- [x] Prisma ORM — queries parametrizadas (sin SQL injection)
- [x] React escapa por defecto (sin XSS directo)
- [x] Validación firma HMAC-SHA256 en webhook Bancard
- [x] Secrets en variables de entorno — nunca en código fuente
- [x] HTTPS forzado en producción (Cloudflare SSL)
- [ ] `npm audit` en CI/CD
- [ ] Dependabot para actualizaciones de dependencias
- [ ] Headers de seguridad (Helmet)

---

## Deploy — Checklist

| Servicio          | Plataforma        | Estado   |
|-------------------|-------------------|----------|
| API NestJS        | Railway           | ⬜ pendiente |
| Worker BullMQ     | Railway           | ⬜ pendiente |
| PostgreSQL        | Railway           | ⬜ pendiente |
| Redis             | Railway / Upstash | ⬜ pendiente |
| Frontend PWA      | Cloudflare Pages  | ⬜ pendiente |
| Media (imágenes)  | Cloudflare R2     | ⬜ pendiente |
| Dominio / SSL     | Cloudflare DNS    | ⬜ pendiente |
| Emails            | Resend            | ⬜ pendiente |

---

*Última actualización: Marzo 2026 — Equipo Labscore*
