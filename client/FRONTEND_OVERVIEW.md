# Frontend — Documentación Técnica Completa

> **Stack:** React 18.3 · TypeScript 5.7 · Vite 6 · React Router 6 · React Query 5 · Zustand 5 · Bootstrap 5
> **Actualizado:** Marzo 2026 — Fase 4 completa

---

## Índice

1. [Resumen del Proyecto](#1-resumen-del-proyecto)
2. [Arquitectura y Estructura de Carpetas](#2-arquitectura-y-estructura-de-carpetas)
3. [Stack Tecnológico Completo](#3-stack-tecnológico-completo)
4. [Funcionalidades por Módulo (Features)](#4-funcionalidades-por-módulo-features)
5. [Sistema de Rutas](#5-sistema-de-rutas)
6. [Gestión de Estado](#6-gestión-de-estado)
7. [Autenticación y Permisos](#7-autenticación-y-permisos)
8. [Internacionalización (i18n)](#8-internacionalización-i18n)
9. [Real-Time con SSE/WebSocket](#9-real-time-con-ssewebsocket)
10. [Sistema de Estilos](#10-sistema-de-estilos)
11. [Testing](#11-testing)
12. [Monitoreo y Observabilidad (Sentry)](#12-monitoreo-y-observabilidad-sentry)
13. [Performance y Virtualización](#13-performance-y-virtualización)
14. [Variables de Entorno](#14-variables-de-entorno)
15. [Comandos de Desarrollo](#15-comandos-de-desarrollo)
16. [Convenciones y Reglas del Proyecto](#16-convenciones-y-reglas-del-proyecto)
17. [Historial de Fases (ROADMAP)](#17-historial-de-fases-roadmap)

---

## 1. Resumen del Proyecto

Aplicación web e-commerce full-featured con dos audiencias principales:

| Audiencia | Acceso | Funcionalidades |
|---|---|---|
| **Clientes** | Público / autenticado | Catálogo, carrito, checkout, órdenes, cuenta, favoritos, reseñas |
| **Administradores** | Rol `ADMIN` o `WAREHOUSE` | Gestión de productos, órdenes, inventario, usuarios, promociones, analytics, banners |

El frontend se comunica con un backend NestJS via `/api/v1` (proxy en desarrollo a `localhost:3070`).

---

## 2. Arquitectura y Estructura de Carpetas

### Principio fundamental: Feature-First con 3 capas

```
core/      →  infraestructura global (nunca importa de features/ ni shared/)
shared/    →  código reutilizable entre features (puede importar de core/)
features/  →  módulos de negocio (puede importar de core/ y shared/)
```

**Un feature NUNCA importa directamente de otro feature.**

### Árbol de carpetas

```
client/src/
│
├── app/
│   ├── providers.tsx          # QueryClientProvider + AuthInit
│   └── router.tsx             # Definición de todas las rutas
│
├── core/                      # Infraestructura global
│   ├── config.ts              # Único punto de acceso a import.meta.env
│   ├── constants/
│   │   ├── routes.ts          # Constantes de rutas (ROUTES.*)
│   │   └── permissions.ts     # Constantes de permisos
│   ├── i18n/
│   │   ├── index.ts           # Configuración de i18next
│   │   └── locales/es/        # Traducciones español: common, catalog, orders, admin, auth
│   └── types/
│       ├── api.ts             # BaseEntity, PaginatedResult, ApiResponse, ApiError
│       └── auth.ts            # User, UserRole, Permission (RBAC granular)
│
├── features/                  # Módulos de negocio
│   ├── auth/                  # Autenticación Firebase + JWT
│   ├── catalog/               # Catálogo de productos
│   ├── cart/                  # Carrito de compras
│   ├── checkout/              # Proceso de pago
│   ├── orders/                # Historial de órdenes
│   ├── account/               # Perfil y preferencias del usuario
│   ├── wishlist/              # Lista de favoritos
│   ├── search/                # Búsqueda de productos
│   ├── reviews/               # Reseñas y valoraciones
│   ├── banners/               # Banners homepage
│   ├── analytics/             # Tracking de analíticas
│   └── admin/                 # Panel de administración
│
├── shared/
│   ├── components/
│   │   ├── AppNavbar.tsx
│   │   ├── AppFooter.tsx
│   │   ├── BottomNav.tsx      # Navegación mobile
│   │   ├── ProtectedRoute.tsx
│   │   ├── MediaGalleryPicker.tsx
│   │   ├── RichTextEditor.tsx # Tiptap
│   │   ├── SectionTitle.tsx
│   │   ├── auth/
│   │   │   └── PermissionGate.tsx     # Control de acceso en UI
│   │   └── feedback/
│   │       ├── ErrorBoundary.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── EmptyState.tsx
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── usePermission.ts           # Fase 3
│   │   ├── useVirtualList.ts          # Fase 4 — @tanstack/react-virtual
│   │   └── useRealtimeQuery.ts        # Fase 4 — SSE + React Query
│   ├── lib/
│   │   ├── api.ts             # Axios con interceptor de refresh automático
│   │   ├── firebase.ts        # Firebase Auth (solo Google Sign-In)
│   │   ├── queryClient.ts     # Configuración React Query
│   │   └── realtime.ts        # createSSEConnection, createWSConnection
│   ├── types/                 # Re-exporta desde core/types (backward compat)
│   └── utils/
│       ├── formatPrice.ts
│       └── formatDate.ts
│
├── styles/
│   ├── main.scss              # Entry point: importa todos los partials
│   ├── _variables.scss        # Tipografía (Sora + DM Sans), paleta, breakpoints
│   ├── _components.scss       # Tarjetas, botones, badges, inputs
│   ├── _layout.scss           # Navbar, footer, admin layout
│   ├── _admin.scss            # Estilos específicos del panel admin
│   ├── _auth.scss             # Páginas de login / registro
│   ├── _hero.scss             # Banners y hero section
│   └── _skeleton.scss         # Loading skeletons
│
└── test/
    ├── setup.ts               # Configuración jsdom
    └── utils.tsx              # createQueryWrapper para tests de hooks
```

---

## 3. Stack Tecnológico Completo

### Dependencias de producción

| Paquete | Versión | Propósito |
|---|---|---|
| `react` | 18.3 | Framework UI |
| `react-dom` | 18.3 | Renderizado DOM |
| `react-router-dom` | 6.x | Routing SPA |
| `@tanstack/react-query` | 5.x | Estado servidor / cache |
| `zustand` | 5.x | Estado global del cliente |
| `axios` | 1.x | HTTP client |
| `bootstrap` | 5.3 | CSS framework |
| `react-bootstrap` | 2.x | Componentes React (Bootstrap) |
| `firebase` | 12.x | Google Sign-In |
| `i18next` + `react-i18next` | 25.x + 16.x | Internacionalización |
| `@sentry/react` | 10.x | Monitoreo de errores |
| `@tanstack/react-virtual` | 3.x | Virtualización de listas |
| `chart.js` + `react-chartjs-2` | 4.x + 5.x | Gráficos de analíticas |
| `@tiptap/react` + extensiones | 3.x | Editor de texto enriquecido |
| `swiper` | 12.x | Carruseles de imágenes |
| `lucide-react` | 0.5x | Íconos SVG |

### Dependencias de desarrollo

| Paquete | Propósito |
|---|---|
| `vite` 6.x + `@vitejs/plugin-react` | Build tool |
| `typescript` ~5.7 | Tipado estático |
| `vitest` 4.x | Test runner |
| `@testing-library/react` 16.x | Tests de componentes y hooks |
| `@testing-library/user-event` 14.x | Simulación de eventos |
| `jsdom` 29.x | DOM virtual para tests |
| `sass` | Compilación SCSS |
| `vite-plugin-pwa` | PWA (Progressive Web App) |

---

## 4. Funcionalidades por Módulo (Features)

### 4.1 `auth` — Autenticación

**Tecnología:** Firebase Authentication (Google) + JWT propio

| Archivo | Responsabilidad |
|---|---|
| `authStore.ts` | Estado global (Zustand): user, accessToken, isAuthenticated, isInitializing |
| `useAuth.ts` | Hook: login, register, loginWithGoogle, logout |
| `auth.service.ts` | Llamadas REST: `/auth/login`, `/auth/register`, `/auth/google`, `/auth/logout`, `/auth/refresh` |
| `LoginPage.tsx` | Formulario login + botón Google |
| `RegisterPage.tsx` | Formulario registro |
| `AuthInit.tsx` (en providers) | Refresh automático del token al cargar la app |

**Flujo del token:**
1. El accessToken se guarda en **memoria** (Zustand, NO localStorage)
2. Solo el usuario se persiste en `localStorage` vía Zustand `partialize`
3. El interceptor de Axios refresca el token automáticamente ante 401

---

### 4.2 `catalog` — Catálogo de Productos

| Archivo | Responsabilidad |
|---|---|
| `useProducts.ts` | Lista paginada con filtros (categoría, búsqueda, precio) |
| `useProductDetail.ts` | Detalle de producto por slug |
| `useCategories.ts` | Árbol de categorías |
| `ProductCard.tsx` | Tarjeta de producto (imagen 1:1, badge descuento, botón wishlist, CTA) |
| `ProductGrid.tsx` | Grid responsivo de tarjetas |
| `HomePage.tsx` | Hero banner + categorías destacadas + productos destacados |
| `CatalogPage.tsx` | Lista de productos con filtros sidebar |
| `ProductPage.tsx` | Detalle: galería, variantes, stocks, reseñas |

---

### 4.3 `cart` — Carrito de Compras

**Estado:** Zustand con persistencia en localStorage (`cart-storage`)

| Acción del store | Comportamiento |
|---|---|
| `addItem(item)` | Agrega o incrementa cantidad + abre drawer + sync servidor en bg |
| `updateItem(id, qty)` | Actualiza cantidad (qty=0 elimina) + sync servidor |
| `removeItem(id)` | Elimina + sync servidor |
| `clearCart()` | Vacía localmente (no llama API) |
| `mergeCart()` | Post-login: fusiona carrito guest con carrito del usuario |
| `syncWithServer()` | Reemplaza carrito local con el del servidor |

**Componentes:**
- `CartDrawer.tsx` — Drawer lateral con lista de items y totales
- `MiniCart.tsx` — Badge con contador en el navbar
- `CartPage.tsx` — Vista completa con input de cupón y totales
- `useCartPricing.ts` — Cálculos de precio con descuentos y envío

---

### 4.4 `checkout` — Proceso de Pago

**Flujo multi-step:** `address` → `review` → `payment`

| Archivo | Responsabilidad |
|---|---|
| `useCheckout.ts` | Orquesta createOrder + initiatePayment, maneja errores |
| `checkout.service.ts` | POST `/orders` + POST `/payments/initiate` |
| `CheckoutPage.tsx` | Selector de dirección, selector de envío, resumen de cupón |
| `CheckoutResultPage.tsx` | Resultado post-pago (éxito / error) |

El DTO incluye: `shippingAddress`, `couponCode?`, `shippingRateId?`, `notes?`

---

### 4.5 `orders` — Órdenes

| Archivo | Responsabilidad |
|---|---|
| `useOrders.ts` | Lista paginada de órdenes del usuario |
| `useOrderDetail.ts` | Detalle de una orden por ID |
| `OrdersPage.tsx` | Lista con badges de estado |
| `OrderDetailPage.tsx` | Detalle con timeline, items, dirección, tracking |
| `OrderTimeline.tsx` | Línea de tiempo del estado de la orden |

**Estados posibles:** `PENDING` → `PAYMENT_PROCESSING` → `PAID` → `PREPARING` → `READY_TO_SHIP` → `SHIPPED` → `DELIVERED` → `COMPLETED` / `CANCELLED` / `REFUNDED`

---

### 4.6 `account` — Perfil de Usuario

- Gestión de datos personales
- Gestión de direcciones guardadas (`AddressManager.tsx`)
- Suscripción/desuscripción a **notificaciones push** (Web Push API, VAPID)

---

### 4.7 `wishlist` — Lista de Favoritos

- `useWishlist.ts`: agrega/elimina/lista productos favoritos
- Sincroniza con API: `GET/POST/DELETE /users/me/wishlist/:productId`
- Integrado en `ProductCard.tsx` con ícono de corazón

---

### 4.8 `search` — Búsqueda

- `SearchBar.tsx` + `useSearch.ts`
- Búsqueda en tiempo real con debounce
- `SearchPage.tsx`: resultados paginados con filtros

---

### 4.9 `reviews` — Reseñas

| Componente | Función |
|---|---|
| `StarRating.tsx` | Estrellas interactivas / solo lectura |
| `ReviewList.tsx` | Lista de reseñas con rating promedio |
| `ReviewForm.tsx` | Formulario de nueva reseña (autenticado) |
| `useReviews.ts` | CRUD de reseñas + paginación |

---

### 4.10 `banners` — Banners Hero

- `HeroBannerSlider.tsx` (Swiper) — Carrusel de banners configurables
- `useBanners.ts` — Fetch de banners activos
- Administración via panel admin (`AdminBannersPage.tsx`)

---

### 4.11 `analytics` — Analíticas

- `analytics.tracker.ts` — Tracking automático de page views (llamado desde el router)
- `useAnalytics.ts` — Datos de analíticas para el panel admin
- Charts con Chart.js: ventas por período, productos más vendidos, categorías, embudo de conversión, top búsquedas

---

### 4.12 `admin` — Panel de Administración

**Acceso:** rol `ADMIN` o `WAREHOUSE`

#### Layout
- `AdminLayout.tsx` — Shell con sidebar colapsable + topbar
- `AdminSidebar.tsx` — Menú de navegación con íconos

#### Páginas admin

| Ruta | Página | Función |
|---|---|---|
| `/admin/dashboard` | `AdminDashboardPage` | KPIs, gráficos, resumen diario |
| `/admin/productos` | `AdminProductsPage` | CRUD productos con scroll virtual (100/pág) |
| `/admin/productos/nuevo` | `AdminProductFormPage` | Crear producto con variantes, imágenes, categorías |
| `/admin/productos/:id/editar` | `AdminProductFormPage` | Editar producto existente |
| `/admin/ordenes` | `AdminOrdersPage` | Gestión órdenes + cambio de estado + tracking |
| `/admin/inventario` | `AdminInventoryPage` | Stock por variante con scroll virtual (100/pág) |
| `/admin/usuarios` | `AdminUsersPage` | Lista usuarios + cambio de rol |
| `/admin/categorias` | `AdminCategoriesPage` | CRUD árbol de categorías |
| `/admin/banners` | `AdminBannersPage` | CRUD banners hero |
| `/admin/analitica` | `AdminAnalyticsPage` | Dashboard de analíticas completo |
| `/admin/promociones` | `AdminPromotionsPage` | CRUD cupones de descuento |
| `/admin/promociones-automaticas` | `AdminAutomaticPromotionsPage` | Reglas de descuento automático |
| `/admin/auditoria` | `AdminAuditPage` | Log de acciones de administradores |
| `/admin/imagenes-huerfanas` | `AdminOrphanedImagesPage` | Limpieza de imágenes huérfanas en R2 |

#### Hooks admin (`features/admin/hooks/useAdmin.ts`)

| Hook | Propósito |
|---|---|
| `useAdminOrders(query)` | Lista órdenes admin con filtros |
| `useUpdateOrderStatus()` | Mutación: cambiar estado + tracking |
| `useAdminInventory(lowStock, page, limit)` | Stock de variantes con filtro low-stock |
| `useUpdateStock()` | Mutación: ajustar stock de variante |
| `useAdminUsers(page, limit)` | Lista usuarios |
| `useUpdateUserRole()` | Mutación: cambiar rol de usuario |
| `useAdminProducts(query)` | Lista productos con búsqueda y filtros |
| `useAdminProduct(id)` | Detalle de un producto |
| `useCreateProduct()` | Mutación: nuevo producto |
| `useUpdateProduct()` | Mutación: editar producto |
| `useDeleteProduct()` | Mutación: eliminar producto |
| `useAddVariant()` | Mutación: agregar variante a producto |
| `useAdminCategories()` | Lista categorías |
| `useAdminCoupons()` | CRUD cupones |
| `useAdminPromotions()` | CRUD promociones automáticas |
| `useAdminBanners()` | CRUD banners |
| `useAdminAnalytics(query)` | Datos de analíticas para dashboard |
| `useAdminAudit(query)` | Log de auditoría |

---

## 5. Sistema de Rutas

### Rutas públicas

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `HomePage` | Página principal |
| `/productos` | `CatalogPage` | Catálogo con filtros |
| `/productos/:slug` | `ProductPage` | Detalle de producto |
| `/carrito` | `CartPage` | Carrito de compras |
| `/buscar` | `SearchPage` | Resultados de búsqueda |
| `/login` | `LoginPage` | Inicio de sesión |
| `/registro` | `RegisterPage` (lazy) | Registro de usuario |

### Rutas protegidas (requieren autenticación)

| Ruta | Componente | Descripción |
|---|---|---|
| `/checkout` | `CheckoutPage` | Proceso de pago |
| `/checkout/result` | `CheckoutResultPage` | Resultado del pago |
| `/pedidos` | `OrdersPage` | Lista de órdenes |
| `/pedidos/:id` | `OrderDetailPage` | Detalle de orden |
| `/cuenta` | `AccountPage` | Perfil y notificaciones |
| `/favoritos` | `WishlistPage` (lazy) | Lista de favoritos |

### Rutas admin (requieren rol ADMIN o WAREHOUSE)

Todas bajo `/admin/*` con `AdminLayout` como shell. Todas las páginas son lazy-loaded con `Suspense`.

### Protección de rutas

```tsx
// ProtectedRoute: redirige a /login si no está autenticado
<ProtectedRoute><CheckoutPage /></ProtectedRoute>

// AdminLayout: verifica rol ADMIN o WAREHOUSE internamente
<Route path="/admin" element={<AdminLayout />}>
  ...
</Route>
```

---

## 6. Gestión de Estado

### Árbol de decisión

```
¿De dónde viene el dato?
│
├── Del servidor / API
│   └── → React Query (useQuery / useMutation)
│       • queryKey descriptiva con dependencias
│       • invalidateQueries en onSuccess de mutaciones
│       • staleTime / gcTime configurados en queryClient global
│
├── Estado global del cliente (persiste entre vistas)
│   ├── Auth → useAuthStore (Zustand)   — features/auth/store/authStore.ts
│   └── Cart → useCartStore (Zustand)   — features/cart/store/cartStore.ts
│
└── Estado de UI local (modal, tab, formulario)
    └── → useState / useReducer en el componente
```

### `useAuthStore` (Zustand)

```ts
// Estado accesible globalmente
{ user, accessToken, isAuthenticated, isInitializing }

// Acciones
setAuth(user, token)    // post-login/register
clearAuth()              // post-logout
updateUser(partial)      // actualizar datos del usuario
setInitializing(bool)    // mientras se resuelve el refresh
```

**Persistencia:** Solo `user` se persiste en `localStorage` bajo la clave `auth-storage`. El `accessToken` queda únicamente en memoria.

### `useCartStore` (Zustand)

```ts
// Estado
{ cart: { items, total, itemCount }, isOpen, isSyncing }

// Acciones
openCart() / closeCart()
addItem(item)              // optimistic + sync en background
updateItem(id, qty)        // qty=0 elimina el item
removeItem(id)
clearCart()
mergeCart()                // post-login: fusiona carrito guest
syncWithServer()           // reemplaza carrito local con el del servidor
```

**Persistencia:** `cart` se persiste en `localStorage` bajo la clave `cart-storage`.

### React Query — configuración global

```ts
// shared/lib/queryClient.ts
defaultOptions: {
  queries: {
    staleTime: 1 * 60 * 1000,  // 1 minuto
    gcTime: 5 * 60 * 1000,     // 5 minutos
    retry: 1,
  }
}
```

---

## 7. Autenticación y Permisos

### Flujo de autenticación

```
1. Usuario hace login (email/pass o Google)
2. Backend devuelve { user, accessToken }
3. useAuthStore.setAuth(user, token) — token en memoria
4. Axios agrega `Authorization: Bearer <token>` en cada request
5. Al expirar (401), interceptor llama /auth/refresh automáticamente
6. Reintenta el request original con el nuevo token
7. Al recargar la app, AuthInit dispara /auth/refresh silencioso
```

### RBAC (Role-Based Access Control)

#### Roles del sistema

| Rol | Descripción |
|---|---|
| `CUSTOMER` | Usuario final del e-commerce |
| `ADMIN` | Acceso total al panel admin |
| `WAREHOUSE` | Acceso limitado (inventario, órdenes) |

#### Permisos granulares

```typescript
type Permission =
  | 'products:read'    | 'products:write'    | 'products:delete'
  | 'orders:read'      | 'orders:write'      | 'orders:cancel'
  | 'users:read'       | 'users:write'
  | 'inventory:read'   | 'inventory:adjust'
  | 'categories:read'  | 'categories:write'
  | 'promotions:read'  | 'promotions:write'
  | 'banners:read'     | 'banners:write'
  | 'analytics:read'
  | 'audit:read';
```

#### Uso en componentes

```tsx
// Hook — retorna boolean
const canDelete = usePermission('products:delete');
<Button disabled={!canDelete}>Eliminar</Button>

// Componente guard — renderiza children si tiene permiso
<PermissionGate permission="products:write">
  <Button>Editar Producto</Button>
</PermissionGate>

// Multiples permisos (cualquiera)
<PermissionGate any={['orders:write', 'orders:cancel']} fallback={<span>Sin acceso</span>}>
  <ActionButtons />
</PermissionGate>
```

---

## 8. Internacionalización (i18n)

**Librería:** `react-i18next` + `i18next-browser-languagedetector`

### Archivos de traducción

```
src/core/i18n/locales/es/
├── common.json    # Acciones genéricas: guardar, cancelar, confirmar, errores
├── catalog.json   # Catálogo: productos, filtros, categorías
├── orders.json    # Órdenes: estados, labels, acciones
├── admin.json     # Panel admin: labels, secciones
└── auth.json      # Auth: login, registro, mensajes
```

### Uso en componentes

```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('common');
<Button>{t('actions.save')}</Button>

// Con namespace específico
const { t } = useTranslation('orders');
<Badge>{t(`status.${order.status}`)}</Badge>
```

---

## 9. Real-Time con SSE/WebSocket

**Archivo:** `src/shared/lib/realtime.ts`

### Funciones disponibles

```typescript
// Crear conexión SSE autenticada
const es = createSSEConnection('/admin/inventory/stream', accessToken);
es.onmessage = (e) => queryClient.setQueryData(['inventory'], JSON.parse(e.data));

// Crear conexión WebSocket autenticada
const ws = createWSConnection('/ws/orders');
ws.onmessage = (e) => {
  const { event, data } = JSON.parse(e.data);
  if (event === 'order.created') queryClient.invalidateQueries({ queryKey: ['orders'] });
};

// Helper para invalidar múltiples queries a la vez
const invalidate = createRealtimeInvalidator(queryClient);
invalidate(['orders'], ['inventory']);
```

### `useRealtimeQuery` (hook)

```typescript
// Combina React Query con SSE automáticamente
const { data } = useRealtimeQuery({
  queryKey: ['admin', 'inventory'],
  queryFn: () => adminService.getInventory(),
  ssePath: '/admin/inventory/stream',
  onMessage: 'replace',      // 'replace' | 'invalidate' | función custom
});
```

**Comportamiento:** Obtiene el snapshot inicial via REST y luego mantiene el cache actualizado via SSE mientras el componente está montado.

---

## 10. Sistema de Estilos

**Bootstrap 5** como base + **SCSS custom** con variables extendidas.

### Paleta de colores

| Variable | Valor | Uso |
|---|---|---|
| `--bs-primary` | `#0F4C81` | Acciones principales |
| `--bs-accent` | `#F97316` | CTA destacados, precios de oferta |
| `--bs-white` | `#FFFFFF` | Fondos |

### Tipografía

- **Sora** — Headings y títulos
- **DM Sans** — Cuerpo de texto y UI

### Orden de importación (obligatorio)

```scss
// main.scss
@import 'bootstrap/scss/bootstrap';  // Variables Bootstrap
@import 'variables';                 // Override variables
@import 'components';
@import 'layout';
@import 'admin';
@import 'auth';
@import 'hero';
@import 'skeleton';
```

### Clases utilitarias custom

```css
.btn-accent          /* Botón naranja de acción */
.card-hover          /* Elevación al hover */
.text-ellipsis       /* Truncado con ... */
.cursor-pointer
```

---

## 11. Testing

**Runner:** Vitest 4 | **DOM:** jsdom | **Testing Library:** @testing-library/react 16

### Cobertura actual

| Archivo | Tipo | Tests |
|---|---|---|
| `shared/utils/formatPrice.test.ts` | Utilidad | 5 |
| `shared/utils/formatDate.test.ts` | Utilidad | 5 |
| `shared/hooks/useDebounce.test.ts` | Hook | 5 |
| `shared/hooks/usePermission.test.ts` | Hook RBAC | 9 |
| `features/auth/hooks/useAuth.test.ts` | Hook crítico | 7 |
| `features/cart/store/cartStore.test.ts` | Store Zustand | 15 |
| `features/checkout/hooks/useCheckout.test.ts` | Hook crítico | 8 |
| **Total** | | **54 tests** |

### Ejecutar tests

```bash
npm test            # Watch mode
npm run test:run    # Una sola pasada
npm run coverage    # Reporte de cobertura
```

### Patrón de test para hooks con React Query

```typescript
import { renderHook, act } from '@testing-library/react';
import { createQueryWrapper } from '../../../test/utils';

const { result } = renderHook(() => useMyHook(), {
  wrapper: createQueryWrapper(),
});
```

### Patrón de test para Zustand stores

```typescript
// Reset antes de cada test
beforeEach(() => {
  useMyStore.setState({ /* estado inicial */ });
});

it('hace algo', () => {
  useMyStore.getState().someAction();
  expect(useMyStore.getState().someValue).toBe(expected);
});
```

---

## 12. Monitoreo y Observabilidad (Sentry)

**Librería:** `@sentry/react` — inicializado en `src/main.tsx`

```typescript
// Solo activo en producción y cuando VITE_SENTRY_DSN está configurado
if (config.sentryDsn) {
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.isDev ? 'development' : 'production',
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: config.isDev ? 1.0 : 0.1,
    enabled: config.isProd,
  });
}
```

**Integración con ErrorBoundary:** Los errores de render capturados por `ErrorBoundary` pueden conectarse con `Sentry.captureException` cuando se implemente.

---

## 13. Performance y Virtualización

### Code splitting

Todas las páginas admin y algunas de cliente son lazy-loaded con `React.lazy` + `Suspense`:

```typescript
const AdminDashboardPage = lazy(() => import('../features/admin/pages/AdminDashboardPage'));
```

### Virtualización de listas largas

**Librería:** `@tanstack/react-virtual`

#### Hook `useVirtualList`

```typescript
// Para cualquier tabla o lista con 50+ filas
const { containerRef, virtualItems, totalSize, measureElement } = useVirtualList({
  count: items.length,
  estimateSize: 56,    // altura estimada de cada fila
  overscan: 5,         // filas pre-renderizadas fuera del viewport
});
```

#### Aplicado en

| Página | Detalles |
|---|---|
| `AdminInventoryPage` | 100 variantes por página, scroll virtual en tbody |
| `AdminProductsPage` | 100 productos por página, scroll virtual en tbody |

**Patrón de implementación:**
```tsx
<div ref={containerRef} style={{ height: 520, overflowY: 'auto' }}>
  <table>
    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>...</thead>
    <tbody style={{ position: 'relative', height: totalSize }}>
      {virtualItems.map((vRow) => (
        <tr
          ref={measureElement}
          data-index={vRow.index}
          style={{ position: 'absolute', transform: `translateY(${vRow.start}px)` }}
        >
          ...
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Otras optimizaciones

- `React.memo` en componentes de presentación costosos
- `useCallback` / `useMemo` en handlers y cálculos de listas grandes
- Imágenes con `onError` fallback para manejar URLs rotas
- PWA con `vite-plugin-pwa` (Service Worker, offline support)

---

## 14. Variables de Entorno

Archivo de referencia: `.env.example` (incluido en el repo)

```bash
# API
VITE_API_URL=http://localhost:3070     # URL base del backend
VITE_API_VERSION=v1                   # Versión del API (default: v1)

# App
VITE_APP_NAME=Mi Tienda
VITE_APP_VERSION=1.0.0

# Firebase (requerido para Google Sign-In)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=

# Push Notifications (Fase 2)
VITE_VAPID_PUBLIC_KEY=

# Sentry (Fase 4 — opcional)
VITE_SENTRY_DSN=
```

**Regla:** Acceder siempre via `config.*` en `src/core/config.ts`, nunca directamente vía `import.meta.env`.

---

## 15. Comandos de Desarrollo

```bash
# Desarrollo local (proxy /api → localhost:3070)
npm run dev

# Build de producción (type-check + build)
npm run build

# Lint
npm run lint

# Preview del build de producción
npm run preview

# Tests en watch mode
npm test

# Tests una sola pasada
npm run test:run

# Reporte de cobertura
npm run coverage
```

---

## 16. Convenciones y Reglas del Proyecto

### Nomenclatura

| Convención | Aplica a | Ejemplo |
|---|---|---|
| `PascalCase` | Componentes, interfaces, types | `ProductCard.tsx`, `User` |
| `camelCase` con `use` | Hooks | `useProducts.ts` |
| `camelCase` | Utils, servicios | `formatPrice.ts`, `auth.service.ts` |
| `UPPER_SNAKE_CASE` | Constantes | `VIRTUAL_PAGE_SIZE = 100` |
| `kebab-case` | Archivos SCSS | `_admin.scss` |

### Reglas de dependencias entre capas

```
❌ features/A importa de features/B
❌ shared/ importa de features/
❌ core/ importa de shared/ o features/
✅ features/ → core/, shared/
✅ shared/ → core/
```

### Reglas de estado

```
❌ useState para datos del servidor → usar React Query
❌ Context para estado global de negocio → usar Zustand
❌ Datos sensibles en localStorage excepto el usuario (no el token)
✅ React Query para todo lo que venga de la API
✅ Zustand solo para: authStore y cartStore
✅ useState para: modales, tabs, formularios locales
```

### Seguridad

```
❌ Hardcodear URLs, tokens o API keys en el código
❌ dangerouslySetInnerHTML sin sanitizar
❌ access_token en localStorage (solo en memoria)
✅ Validar permisos en frontend Y backend
✅ ProtectedRoute para todas las rutas autenticadas
✅ PermissionGate para acciones sensibles en el UI
```

---

## 17. Historial de Fases (ROADMAP)

### ✅ Fase 1 — Fundamentos

- `src/core/` con `config.ts`, `types/api.ts`, `types/auth.ts`, `constants/routes.ts`, `constants/permissions.ts`
- `ErrorBoundary` implementado como class component en `shared/components/feedback/`
- Testing configurado: Vitest + @testing-library/react + jsdom
- Tests en `shared/utils/` (`formatPrice`, `formatDate`) y `shared/hooks/` (`useDebounce`, `usePermission`)
- `CLAUDE.md` actualizado con arquitectura real

### ✅ Fase 2 — Refactor Estructural

- Páginas movidas a `features/[nombre]/pages/`:
  - `catalog/pages/`: `HomePage`, `CatalogPage`, `ProductPage`
  - `cart/pages/`: `CartPage`
  - `checkout/pages/`: `CheckoutPage`, `CheckoutResultPage`
  - `orders/pages/`: `OrdersPage`, `OrderDetailPage`
  - `account/pages/`: `AccountPage`
  - `wishlist/pages/`: `WishlistPage`
  - `search/pages/`: `SearchPage`
  - `auth/pages/`: `LoginPage`, `RegisterPage`
- `admin/` organizado con `hooks/`, `pages/`, `services/`, `types/`, `layout/`
- Zustand formalizado como estándar para estado global del cliente
- Backend Phase 2: ShippingModule, PromotionsModule, NotificationsModule, ReviewsModule

### ✅ Fase 3 — Capacidades ERP

- **RBAC granular:** `Permission` type en `core/types/auth.ts`, `usePermission` hook, `PermissionGate` componente
- **i18n:** `react-i18next` + `i18next-browser-languagedetector`, 5 namespaces para español
- **Real-time:** `shared/lib/realtime.ts` con `createSSEConnection`, `createWSConnection`, `createRealtimeInvalidator`

### ✅ Fase 4 — Escala Avanzada

- **Sentry:** `@sentry/react` integrado en `main.tsx`, activo solo en producción
- **Virtualización:** `@tanstack/react-virtual` instalado, `useVirtualList` hook en `shared/hooks/`, aplicado en `AdminInventoryPage` y `AdminProductsPage` (100 items/página)
- **`useRealtimeQuery`:** Hook en `shared/hooks/` que combina SSE + React Query con soporte para `replace`, `invalidate` y función custom
- **Tests hooks críticos:** `useAuth` (7 tests), `cartStore` (15 tests), `useCheckout` (8 tests) — **54 tests totales**
- **API versioning:** `VITE_API_VERSION` en `core/config.ts` (default `v1`)

---

*Para preguntas sobre el backend, ver `server/CLAUDE.md`.  
Para decisiones de arquitectura y guía de estilos de código, ver `client/CLAUDE.md`.*
