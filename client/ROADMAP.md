# Plan de Mejoras — Frontend ERP Escalable

> **Versión:** 1.0 | **Fecha:** Marzo 2026
> Basado en análisis de arquitectura actual vs. lineamientos ERP empresarial.

---

## Estado Actual (Baseline)

| Aspecto | Estado |
|---|---|
| Estructura de features | Bien — cada feature tiene service/types/hooks/components/index.ts |
| HTTP client | Bien — interceptor de refresh, token en memoria, base `/api/v1` |
| Auth store | Bien — Zustand (`authStore.ts`), no Context |
| Admin pages | Bien — lazy-loaded con Suspense |
| `src/core/` | Ausente — la guía lo referencia pero no existe |
| `src/pages/` | Plano — páginas fuera de sus features |
| Testing | No configurado |
| i18n | Ausente |
| RBAC granular | Solo a nivel de ruta |
| ErrorBoundary | Mencionado, no implementado |
| Feature `admin/` | Monolítico — 10+ hooks en un solo feature |

---

## Fase 1 — Fundamentos (Semanas 1–2)

> Objetivo: cerrar las brechas de infraestructura sin tocar lógica de negocio.
> Sin breaking changes. Bajo riesgo.

### 1.1 Crear `src/core/`

La guía referencia `core/` pero no existe. Crear la capa de infraestructura global:

```
src/core/
├── config.ts          # Centralizar acceso a import.meta.env
├── types/
│   ├── api.ts         # BaseEntity, PaginatedResponse, ApiError
│   └── auth.ts        # User, UserRole
└── constants/
    └── routes.ts      # Constantes de rutas (evitar strings mágicos)
```

**Tareas:**
- [ ] Crear `src/core/config.ts` — centralizar todas las `import.meta.env.VITE_*`
- [ ] Crear `src/core/types/api.ts` — mover tipos base que hoy están dispersos en features
- [ ] Crear `src/core/constants/routes.ts` — extraer strings de rutas del router
- [ ] Actualizar imports en features afectados

**Impacto:** Bajo. Solo mueve tipos existentes, no cambia comportamiento.

---

### 1.2 ErrorBoundary Global

`shared/components/feedback/ErrorBoundary.tsx` está listado pero no implementado.

```tsx
// shared/components/feedback/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<Props, State> {
  // Captura errores de render sin derribar toda la app
  // Prop: fallback, onError (para reportar a Sentry en el futuro)
}
```

**Tareas:**
- [ ] Implementar `ErrorBoundary` como class component con `componentDidCatch`
- [ ] Envolver cada feature-page en su propio `ErrorBoundary` en el router
- [ ] Crear componente `ErrorFallback` con opción de reintentar

**Impacto:** Bajo. Agrega resiliencia sin tocar lógica existente.

---

### 1.3 Actualizar CLAUDE.md — Eliminar Divergencias

La guía tiene instrucciones contradictorias con el código real:

| La guía dice | La realidad es |
|---|---|
| Auth → React Context | Auth → Zustand (`authStore.ts`) |
| HTTP client en `core/services/` | HTTP client en `shared/lib/api.ts` |
| Versiones React 19, Router 7, Vite 7 | React 18.3, Router 6, Vite 6 |
| Estado global → Context | Estado global → Zustand |
| ApiService God Class | Servicios separados por feature ✅ |

**Tareas:**
- [ ] Actualizar §2 Stack Tecnológico con versiones reales
- [ ] Actualizar §3 Estructura de Carpetas para reflejar `shared/lib/` sobre `core/services/`
- [ ] Actualizar §6 Manejo de Estado — agregar Zustand como herramienta oficial
- [ ] Agregar sección "Arquitectura Real" que documente el patrón de servicios por feature

---

### 1.4 Configurar Testing

La guía §14 define la estrategia, pero el proyecto tiene "No test runner is configured".

**Tareas:**
- [ ] Instalar: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`
- [ ] Configurar `vitest.config.ts` con ambiente jsdom
- [ ] Crear `src/test/utils.tsx` con `createQueryWrapper` (ya referenciado en la guía)
- [ ] Escribir tests iniciales en los 3 hooks más críticos: `useAuth`, `useCart`, `useCheckout`

```json
// package.json — agregar
"test": "vitest",
"test:ui": "vitest --ui",
"coverage": "vitest run --coverage"
```

**Impacto:** Medio. Requiere configuración inicial, pero no toca código de producción.

---

## Fase 2 — Refactor Estructural (Semanas 3–6)

> Objetivo: alinear la estructura real con los lineamientos de escalabilidad.
> Cambios con impacto en imports. Ejecutar feature por feature para control.

### 2.1 Mover Páginas dentro de Features

`src/pages/` es un directorio plano con todas las páginas. El estándar es que cada feature tenga `features/[nombre]/pages/`.

**Estado actual:**
```
src/pages/
  HomePage.tsx
  ProductsPage.tsx
  CartPage.tsx
  CheckoutPage.tsx
  OrdersPage.tsx
  ...
```

**Estado objetivo:**
```
src/features/catalog/pages/ProductsPage.tsx
src/features/catalog/pages/ProductDetailPage.tsx
src/features/cart/pages/CartPage.tsx
src/features/checkout/pages/CheckoutPage.tsx
src/features/orders/pages/OrdersPage.tsx
src/features/orders/pages/OrderDetailPage.tsx
```

**Tareas (por feature, en orden de menor a mayor complejidad):**
- [ ] `search` — SearchPage → `features/search/pages/`
- [ ] `wishlist` — FavoritosPage → `features/wishlist/pages/`
- [ ] `account` — CuentaPage → `features/account/pages/`
- [ ] `orders` — OrdersPage, OrderDetailPage → `features/orders/pages/`
- [ ] `checkout` — CheckoutPage, CheckoutResultPage → `features/checkout/pages/`
- [ ] `cart` — CartPage → `features/cart/pages/`
- [ ] `catalog` — HomePage, ProductsPage, ProductDetailPage → `features/catalog/pages/`
- [ ] Actualizar `src/app/router.tsx` con nuevas rutas de imports
- [ ] Eliminar `src/pages/` cuando esté vacío

**Regla:** Mover un feature a la vez, hacer commit por feature, nunca en bulk.

---

### 2.2 Dividir Feature `admin/` en Sub-Features

`src/features/admin/` tiene 10+ hooks mezclados (productos, órdenes, usuarios, inventario, etc.). Esto viola el principio de feature-first.

**Estado objetivo:**
```
src/features/admin/
├── _core/               # AdminLayout, AdminSidebar — compartido entre sub-features
├── products/            # useAdminProducts, useAdminVariants, páginas admin de productos
├── orders/              # useAdminOrders, páginas admin de órdenes
├── inventory/           # useAdminInventory
├── users/               # useAdminUsers
├── categories/          # useAdminCategories
├── promotions/          # useAdminPromotions
├── analytics/           # useAdminAnalytics (o fusionar con features/analytics)
├── banners/             # useAdminBanners (o fusionar con features/banners)
└── audit/               # useAdminAudit
```

**Tareas:**
- [ ] Auditar `features/admin/useAdmin.ts` — listar todos los hooks
- [ ] Crear sub-carpetas dentro de `admin/`
- [ ] Migrar hooks/servicios a sus sub-features
- [ ] Mantener `admin/_core/` para `AdminLayout` y `AdminSidebar`
- [ ] Actualizar imports en páginas admin

---

### 2.3 Estandarizar Manejo de Estado con Zustand

El proyecto ya usa Zustand (`cartStore.ts`, `authStore.ts`) pero la guía recomienda Context. Formalizar Zustand como estándar.

**Patrón a documentar:**
```typescript
// Cuándo usar cada herramienta:
// - Server state (fetch/mutate) → React Query
// - Client state global (cart, auth, UI global) → Zustand
// - UI state local (modal, tab) → useState
// - Form state → react-hook-form (evaluar agregar)
```

**Tareas:**
- [ ] Actualizar §6 de CLAUDE.md con el árbol de decisión corregido
- [ ] Revisar si hay algún uso de Context que deba migrarse a Zustand
- [ ] Definir patrón estándar de slice Zustand (con devtools en desarrollo)

---

## Fase 3 — Capacidades ERP (Semanas 7–12)

> Objetivo: agregar las funcionalidades que distinguen un ERP de un e-commerce simple.
> Requiere coordinación con backend.

### 3.1 Sistema de Permisos Granular (RBAC)

Hoy solo hay protección a nivel de ruta. Un ERP necesita permisos a nivel de acción y campo.

**Diseño:**

```typescript
// core/types/auth.ts
type Permission =
  | 'products:read' | 'products:write' | 'products:delete'
  | 'orders:read'   | 'orders:write'   | 'orders:cancel'
  | 'users:read'    | 'users:write'
  | 'inventory:read'| 'inventory:adjust'
  | 'reports:read'  | 'promotions:write';

interface User {
  id: string;
  role: UserRole;
  permissions: Permission[];  // Permisos explícitos del backend
}
```

```tsx
// shared/hooks/usePermission.ts
export const usePermission = (permission: Permission): boolean => {
  const { user } = useAuthStore();
  return user?.permissions.includes(permission) ?? false;
};

// Uso en componentes:
const canDelete = usePermission('products:delete');
<Button disabled={!canDelete} onClick={handleDelete}>Eliminar</Button>

// shared/components/auth/PermissionGate.tsx
<PermissionGate permission="products:write">
  <Button>Editar Producto</Button>
</PermissionGate>
```

**Tareas:**
- [ ] Definir enum de permisos en `core/types/auth.ts` (coordinar con backend)
- [ ] Crear hook `usePermission(permission)`
- [ ] Crear componente `<PermissionGate permission="..." fallback={...}>`
- [ ] Reemplazar checks manuales de rol en componentes admin
- [ ] Documentar en CLAUDE.md §12

---

### 3.2 Internacionalización (i18n)

```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

**Estructura:**
```
src/
├── core/
│   └── i18n/
│       ├── index.ts          # Configuración de i18next
│       └── locales/
│           ├── es/
│           │   ├── common.json    # Acciones, estados, errores genéricos
│           │   ├── catalog.json
│           │   ├── orders.json
│           │   └── admin.json
│           └── en/
│               └── ...
```

**Tareas:**
- [ ] Instalar y configurar `react-i18next` en `core/i18n/`
- [ ] Extraer strings hardcodeados en español — empezar por feature `catalog`
- [ ] Agregar selector de idioma en `AppNavbar`
- [ ] Documentar convención de keys en CLAUDE.md

**Nota:** Priorizar extracción sobre traducción. Que todo pase por `t('key')` antes de agregar idiomas.

---

### 3.3 Estrategia Real-Time (WebSocket / SSE)

Para inventario en tiempo real, notificaciones de órdenes, etc.

**Patrón recomendado — integración con React Query:**

```typescript
// shared/lib/realtime.ts
// Opción A: SSE (más simple, unidireccional)
export const createEventSource = (path: string) =>
  new EventSource(`${config.apiUrl}${path}`);

// shared/hooks/useRealtimeQuery.ts
export const useRealtimeQuery = <T>(queryKey: QueryKey, path: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const es = createEventSource(path);
    es.onmessage = (e) => {
      queryClient.setQueryData(queryKey, JSON.parse(e.data));
    };
    return () => es.close();
  }, []);

  return useQuery<T>({ queryKey, queryFn: () => fetchInitialData(path) });
};
```

**Tareas:**
- [ ] Evaluar con backend: SSE vs WebSocket (SSE preferido para datos unidireccionales)
- [ ] Implementar `shared/lib/realtime.ts`
- [ ] Aplicar en `admin/inventory/` (stock en tiempo real)
- [ ] Aplicar en `admin/orders/` (nuevas órdenes sin refresh)

---

## Fase 4 — Escala Avanzada (Semanas 13–20)

> Objetivo: preparar el sistema para crecimiento de equipo y funcionalidad.

### 4.1 Monitoreo de Errores — Sentry

```typescript
// core/config.ts — ya tiene VITE_SENTRY_DSN en .env.example
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: config.sentryDsn,
  environment: import.meta.env.MODE,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.1,
});
```

**Tareas:**
- [ ] Instalar `@sentry/react`
- [ ] Configurar en `main.tsx`
- [ ] Conectar `ErrorBoundary` con `Sentry.captureException`
- [ ] Configurar source maps en `vite.config.ts`

---

### 4.2 Virtualización de Listas Largas

El checklist ya menciona virtualización para +100 items, pero no hay implementación.

```bash
npm install @tanstack/react-virtual
```

**Aplicar en:**
- [ ] Tabla de productos en admin (`admin/products/`)
- [ ] Historial de órdenes en admin (`admin/orders/`)
- [ ] Selector de productos en POS/checkout (si aplica)

---

### 4.3 Estrategia de API Versioning

El cliente ya usa `/api/v1`. Formalizar cómo manejar versiones futuras:

```typescript
// core/config.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  apiVersion: import.meta.env.VITE_API_VERSION ?? 'v1',  // default v1
} as const;

// shared/lib/api.ts
baseURL: `${config.apiUrl}/api/${config.apiVersion}`
```

**Tareas:**
- [ ] Agregar `VITE_API_VERSION` a `.env.example`
- [ ] Actualizar `api.ts` para usar `config.apiVersion`
- [ ] Documentar protocolo de migración cuando haya breaking changes en el API

---

### 4.4 Cobertura de Testing — Objetivo 70%

Una vez configurado el runner en Fase 1:

**Prioridades de tests:**

| Feature | Qué testear | Prioridad |
|---|---|---|
| `auth` | `useAuth`, flujo de refresh token | Alta |
| `cart` | `cartStore` — todas las acciones | Alta |
| `checkout` | `useCheckout` — validaciones | Alta |
| `catalog` | `useProducts` — filtros, paginación | Media |
| `orders` | `useOrders` — estados de orden | Media |
| `shared/utils` | `formatPrice`, `formatDate` | Alta (fácil) |
| `shared/hooks` | `useDebounce` | Alta (fácil) |

**Tareas:**
- [ ] Alcanzar 80% de cobertura en `shared/utils/`
- [ ] Alcanzar 70% de cobertura en hooks críticos (auth, cart, checkout)
- [ ] Configurar coverage report en CI
- [ ] Agregar `npm run test` al checklist de merge (§15 CLAUDE.md)

---

## Resumen de Fases

| Fase | Período | Esfuerzo | Riesgo | Valor |
|---|---|---|---|---|
| **1 — Fundamentos** | Semanas 1–2 | Bajo | Bajo | Alto |
| **2 — Refactor Estructural** | Semanas 3–6 | Medio | Medio | Alto |
| **3 — Capacidades ERP** | Semanas 7–12 | Alto | Medio | Muy Alto |
| **4 — Escala Avanzada** | Semanas 13–20 | Medio | Bajo | Medio |

---

## Reglas de Ejecución

1. **Una fase a la vez.** No iniciar Fase 2 hasta cerrar Fase 1.
2. **Una tarea a la vez dentro de cada fase.** Commit atómico por tarea.
3. **No refactorizar lo que no está roto.** Si un feature funciona y está testeado, no tocarlo solo por estética.
4. **El CLAUDE.md debe actualizarse junto con cada cambio estructural.** Nunca dejar la guía desactualizada respecto al código real.
5. **Coordinar Fase 3 con backend.** RBAC y real-time requieren contratos de API antes de implementar.
