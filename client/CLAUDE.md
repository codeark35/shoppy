# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

```bash
npm run dev        # Start dev server (proxies /api to localhost:3070)
npm run build      # Type-check + production build
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

No test runner is configured in this project.

---

## Actual Project Architecture

This is a customer-facing e-commerce storefront + admin dashboard.

**Actual folder layout:**
```
src/
├── app/            # providers.tsx (QueryClient + AuthInit) and router.tsx
├── assets/         # Static images
├── core/           # ⚙️ Infraestructura global (añadida en Fase 1 del ROADMAP)
│   ├── config.ts   # Acceso centralizado a import.meta.env — único punto de entrada
│   ├── constants/
│   │   └── routes.ts   # Constantes de rutas (ROUTES.HOME, ROUTES.ADMIN.DASHBOARD, etc.)
│   └── types/
│       ├── api.ts       # BaseEntity, PaginatedResult, ApiResponse, ApiError
│       └── auth.ts      # User, UserRole, Permission (permisos granulares Fase 3)
├── features/       # Feature modules (ver tabla abajo)
│   └── [feature]/
│       ├── components/
│       ├── hooks/
│       ├── pages/      # Páginas del feature (movidas de src/pages/ en Fase 2)
│       ├── services/
│       ├── store/      # Solo features con estado Zustand (auth, cart)
│       └── types/
├── shared/
│   ├── components/
│   │   ├── feedback/   # ErrorBoundary, LoadingSpinner, EmptyState (Fase 1)
│   │   └── ...         # AppNavbar, AppFooter, BottomNav, ProtectedRoute, RichTextEditor, MediaGalleryPicker
│   ├── hooks/          # useDebounce
│   ├── lib/            # api.ts (Axios), firebase.ts, queryClient.ts
│   ├── types/          # Re-exporta desde core/types/api (backward compat)
│   └── utils/          # formatDate, formatPrice
├── test/           # Configuración de tests (createQueryWrapper, setup.ts)
└── styles/         # SCSS modules (_variables, _components, _layout, _admin, _auth, _hero, _skeleton, main.scss)
```

**Features y sus responsabilidades:**

| Feature | Archivos clave | Notas |
|---|---|---|
| `auth` | AuthInit, LoginModal, GoogleSignInButton, useAuth, authStore, auth.service | Firebase + JWT; token en memoria |
| `catalog` | ProductCard, ProductGrid, useProducts, useProductDetail, useCategories | Navegación pública |
| `cart` | CartDrawer, MiniCart, cartStore, useCartPricing | Zustand + sync servidor |
| `checkout` | useCheckout, checkout.service | Protegida |
| `orders` | OrderList, OrderDetail, OrderTimeline, useOrders | Protegida |
| `account` | AddressManager, useAccount | Protegida |
| `wishlist` | useWishlist, wishlist.service | Protegida |
| `search` | SearchBar, useSearch | |
| `reviews` | StarRating, ReviewList, ReviewForm, useReviews | |
| `admin` | AdminLayout, AdminSidebar, useAdmin (10+ hooks), admin.service | Rol: ADMIN o WAREHOUSE |
| `analytics` | useAnalytics, analytics.service, analytics.tracker | Page view tracking |
| `banners` | useBanners, HeroBannerSlider, banners.service | |

**Routing (`src/app/router.tsx`):**
- Públicas: `/`, `/productos`, `/productos/:slug`, `/carrito`, `/buscar`, `/login`, `/registro`
- Protegidas (auth): `/checkout`, `/checkout/result`, `/pedidos`, `/pedidos/:id`, `/cuenta`, `/favoritos`
- Admin (rol ADMIN/WAREHOUSE): `/admin/dashboard`, `/admin/productos`, `/admin/ordenes`, `/admin/inventario`, `/admin/usuarios`, `/admin/categorias`, `/admin/banners`, `/admin/analitica`, `/admin/promociones`, `/admin/auditoria`, etc.
- Todas las páginas admin son lazy-loaded con Suspense

**Estado real de implementación:**
- **Estado global:** Zustand para auth (`authStore`) y cart (`cartStore`). NO usar Context para estado global.
- **Estado servidor:** React Query para todos los datos de API.
- **Estado UI local:** `useState` / `useReducer` en componentes.
- **Estilos:** SCSS en `src/styles/`. Orden de import: Bootstrap → `main.scss` (que importa partials).
- **Versiones reales:** React 18.3, React Router 6, Vite 6.
- **HTTP client:** `src/shared/lib/api.ts` — Axios con interceptor de refresh automático, token en memoria (no localStorage).
- **Firebase:** Solo para Google Sign-In. Config via `VITE_FIREBASE_*` env vars.
- **Testing:** Vitest + @testing-library/react. Correr con `npm test`.
- **Extras:** Tiptap (rich text), Chart.js (analytics admin), Swiper (carouseles), PWA via vite-plugin-pwa.

---

## Guía de Arquitectura Frontend — Estándar Empresarial

> **Versión:** 2.0 | **Actualizado:** Marzo 2026
> Documento de referencia para todos los proyectos frontend. Aplicar desde el primer commit.

---

## Índice

1. [Principios Fundamentales](#1-principios-fundamentales)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura de Carpetas](#3-estructura-de-carpetas)
4. [Arquitectura de Features](#4-arquitectura-de-features)
5. [Convenciones de Código](#5-convenciones-de-código)
6. [Manejo de Estado](#6-manejo-de-estado)
7. [Patrones de Componentes](#7-patrones-de-componentes)
8. [Servicios y API](#8-servicios-y-api)
9. [Routing y Navegación](#9-routing-y-navegación)
10. [Performance y Optimización](#10-performance-y-optimización)
11. [Estilos y UI](#11-estilos-y-ui)
12. [Seguridad Frontend](#12-seguridad-frontend)
13. [Variables de Entorno](#13-variables-de-entorno)
14. [Testing](#14-testing)
15. [Checklist por Feature](#15-checklist-por-feature)
16. [Errores Comunes a Evitar](#16-errores-comunes-a-evitar)

---

## 1. Principios Fundamentales

Estos principios aplican a **todos los proyectos**, independientemente del dominio o tamaño.

| Principio | Descripción |
|---|---|
| **Feature-First** | Cada módulo de negocio es autocontenido |
| **Separation of Concerns** | Core, Features y Shared tienen roles distintos y no se mezclan |
| **Composition over Inheritance** | Hooks y componentes composables antes que herencia de clases |
| **Type Safety** | TypeScript estricto. Prohibido el uso de `any` |
| **Performance First** | Code splitting, lazy loading y memoización desde el inicio |
| **Fail Loudly** | Los errores deben ser visibles y manejados explícitamente |
| **No Lógica en Vistas** | Las páginas orquestan; los hooks y servicios implementan |

---

## 2. Stack Tecnológico

### Base (aplica a todos los proyectos)

```json
{
  "react": "^18.x",
  "typescript": "~5.x",
  "vite": "^6.x",
  "react-router-dom": "^6.x"
}
```

### Estado y Datos

```json
{
  "@tanstack/react-query": "^5.x",
  "axios": "^1.x"
}
```

### UI

```json
{
  "bootstrap": "^5.x",
  "react-bootstrap": "^2.x"
}
```

### Utilidades comunes

```json
{
  "date-fns": "^4.x",
  "react-hot-toast": "^2.x",
  "lucide-react": "^0.5x",
  "zod": "^3.x"
}
```

> **Regla:** No instalar librerías sin evaluar tamaño de bundle y necesidad real. Preferir utilidades nativas del lenguaje cuando basten.

---

## 3. Estructura de Carpetas

```
client/
├── public/
│   └── ...                          # Assets estáticos, PWA, favicons
│
├── src/
│   ├── main.tsx                     # Entry point — solo configuración
│   ├── App.tsx                      # Root: routing + providers
│   │
│   ├── core/                        # ⚙️ Infraestructura global (no cambia entre features)
│   │   ├── contexts/                # Contextos globales: Auth, Theme, Config
│   │   ├── services/                # Cliente HTTP, API base, interceptores
│   │   └── types/                   # Tipos TypeScript compartidos entre todo el proyecto
│   │
│   ├── features/                    # 📦 Módulos de negocio (uno por dominio)
│   │   └── [feature-name]/
│   │       ├── components/          # Componentes propios del feature
│   │       ├── hooks/               # Hooks de lógica del feature
│   │       └── pages/               # Vistas/páginas del feature
│   │
│   ├── shared/                      # 🔄 Código reutilizable entre features
│   │   ├── components/
│   │   │   ├── ui/                  # Componentes UI genéricos (Button, Badge, Modal)
│   │   │   ├── layout/              # Navbar, Sidebar, Layout base
│   │   │   ├── forms/               # Input, Select, DatePicker reutilizables
│   │   │   └── feedback/            # Loaders, Alerts, EmptyState, ErrorBoundary
│   │   ├── hooks/                   # Hooks compartidos (useDebounce, usePagination)
│   │   └── utils/                   # Funciones puras: formateo, cálculos, validaciones
│   │
│   ├── assets/                      # Imágenes, fuentes locales, SVGs
│   └── styles/                      # CSS global y overrides
│
├── index.html
├── vite.config.ts
├── tsconfig.json
└── .env.example                     # Siempre documentar las variables requeridas
```

### Reglas de dependencias entre capas

```
features/  →  puede importar de  →  core/, shared/
shared/    →  puede importar de  →  core/
core/      →  NO importa de features/ ni shared/
```

**Un feature NUNCA importa de otro feature directamente.** Si necesita datos de otro, van a `shared/` o `core/`.

---

## 4. Arquitectura de Features

### Estructura obligatoria de cada feature

```
features/[nombre]/
├── components/       # Componentes específicos — NO exportar a otros features
├── hooks/            # Lógica de negocio encapsulada
└── pages/            # Orquestador: une componentes + hooks + routing
```

### Responsabilidades por capa

**`components/`** — Presentación  
- Solo reciben props y renderizan UI
- Sin llamadas directas a API
- Sin lógica de negocio

**`hooks/`** — Lógica  
- Encapsulan llamadas a React Query, mutaciones, estado derivado
- Retornan datos procesados listos para consumir
- Deben ser testeables de forma aislada

**`pages/`** — Orquestación  
- Conectan hooks con componentes
- Manejan estado de UI de la vista (modal abierto, tab activo, etc.)
- Son el punto de entrada del routing

---

## 5. Convenciones de Código

### Nomenclatura de archivos

```
PascalCase  →  Componentes: ProductCard.tsx, UserForm.tsx
camelCase   →  Hooks: useCart.ts, useCustomers.ts
camelCase   →  Utils: currency.ts, formatters.ts
UPPER_SNAKE →  Constantes: API_ROUTES.ts
kebab-case  →  Estilos: custom.css, theme-vars.css
```

### Nomenclatura de código

```typescript
const ProductCard: React.FC = () => {}        // Componente → PascalCase
const useProducts = () => {}                  // Hook → camelCase con "use"
const handleSubmit = () => {}                 // Handler → "handle" + acción
const isLoading = false                       // Boolean → "is/has/can" + estado
const API_BASE_URL = '...'                    // Constante → UPPER_SNAKE_CASE
interface ProductProps {}                     // Interface → PascalCase
type UserRole = 'admin' | 'user'             // Type → PascalCase
```

### Estructura interna de un componente

```tsx
// 1. Imports — agrupados y ordenados
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
// UI externos
import { Container, Button } from 'react-bootstrap';
// Core
import type { Product } from '../../../core/types/api';
import apiService from '../../../core/services/api';
// Shared
import { LoadingSpinner } from '../../../shared/components/feedback/LoadingSpinner';
// Feature-local
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';

// 2. Interfaces y tipos del componente
interface ProductsPageProps {
  defaultCategory?: string;
}

// 3. Constantes del módulo
const PAGE_SIZE = 12;

// 4. Componente
const ProductsPage: React.FC<ProductsPageProps> = ({ defaultCategory }) => {
  // A. Routing
  const navigate = useNavigate();

  // B. Estado local (UI)
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  // C. Custom hooks (lógica de negocio)
  const { products, isLoading, createProduct } = useProducts({ page, limit: PAGE_SIZE });

  // D. Valores derivados
  const isEmpty = !isLoading && products.length === 0;

  // E. Handlers
  const handleCreate = useCallback((data: Partial<Product>) => {
    createProduct(data);
    setShowModal(false);
  }, [createProduct]);

  // F. Early returns
  if (isLoading) return <LoadingSpinner />;

  // G. Render
  return (
    <Container>
      {/* JSX */}
    </Container>
  );
};

export default ProductsPage;
```

---

## 6. Manejo de Estado

### Decisión de qué herramienta usar

```
¿De dónde viene el dato?
│
├── Del servidor / API
│   └── → React Query (useQuery / useMutation)
│
├── Global en toda la app (auth, carrito, UI global)
│   └── → Zustand (store en features/[nombre]/store/)
│       Regla: un archivo de store por feature, no un store global monolítico.
│
└── Solo en esta pantalla o componente
    └── → useState / useReducer
```

> **Nota:** Este proyecto usa **Zustand** como estándar para estado global del cliente.
> React Context solo se usa cuando una librería externa lo impone (ej. QueryClientProvider).
> NO crear nuevos contextos de React para estado de negocio.

### React Query — Configuración base

```tsx
// App.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,       // 2 min — cuánto tiempo el dato es "fresco"
      gcTime: 5 * 60 * 1000,          // 5 min — cuánto tiempo vive en cache
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});
```

### React Query — Uso estándar

```tsx
// Lectura
const { data, isLoading, error } = useQuery({
  queryKey: ['products', filters],       // key descriptiva con sus dependencias
  queryFn: () => apiService.getProducts(filters),
  enabled: !!filters.categoryId          // no ejecutar si falta dato requerido
});

// Escritura
const createMutation = useMutation({
  mutationFn: apiService.createProduct,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    toast.success('Creado correctamente');
  },
  onError: (error: AxiosError) => {
    toast.error(error.response?.data?.message ?? 'Error inesperado');
  }
});
```

### Context — Solo para estado realmente global

```tsx
// core/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Hook de consumo — siempre en el mismo feature
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
```

---

## 7. Patrones de Componentes

### Componente de presentación (Presentational)

```tsx
// Solo props → solo UI. Sin lógica, sin side effects.
interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export const ProductCard = React.memo<ProductCardProps>(({ product, onEdit, onDelete }) => (
  <Card>
    <Card.Body>
      <Card.Title>{product.name}</Card.Title>
      <Button onClick={() => onEdit(product)}>Editar</Button>
      <Button variant="danger" onClick={() => onDelete(product.id)}>Eliminar</Button>
    </Card.Body>
  </Card>
));

ProductCard.displayName = 'ProductCard';
```

### Custom Hook de feature

```tsx
// hooks/useProducts.ts
export const useProducts = (options: UseProductsOptions = {}) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', options],
    queryFn: () => apiService.getProducts(options)
  });

  const createMutation = useMutation({
    mutationFn: apiService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto creado');
    }
  });

  return {
    products: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    createProduct: createMutation.mutate,
    isCreating: createMutation.isPending
  };
};
```

### Protección de rutas (HOC)

```tsx
// shared/components/layout/RoleProtectedRoute.tsx
interface Props {
  roles: string[];
  children: React.ReactNode;
}

export const RoleProtectedRoute: React.FC<Props> = ({ roles, children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
};
```

---

## 8. Servicios y API

### Cliente HTTP base

```typescript
// core/services/http.client.ts
export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Inyectar token automáticamente
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Manejar token expirado
httpClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await httpClient.request<T>(config);
  return response.data;
}
```

### API Service — Organización por dominio

```typescript
// core/services/api.ts
class ApiService {

  // ── PRODUCTS ──────────────────────────────────────
  getProducts = (params?: ProductFilters) =>
    request<PaginatedResponse<Product>>({ method: 'GET', url: '/products', params });

  getProduct = (id: string) =>
    request<Product>({ method: 'GET', url: `/products/${id}` });

  createProduct = (data: Partial<Product>) =>
    request<Product>({ method: 'POST', url: '/products', data });

  updateProduct = (id: string, data: Partial<Product>) =>
    request<Product>({ method: 'PUT', url: `/products/${id}`, data });

  deleteProduct = (id: string) =>
    request<void>({ method: 'DELETE', url: `/products/${id}` });

  // ── CUSTOMERS ─────────────────────────────────────
  getCustomers = (params?: CustomerFilters) =>
    request<PaginatedResponse<Customer>>({ method: 'GET', url: '/customers', params });

  // ... más métodos agrupados por dominio
}

export default new ApiService();
```

### Tipos base del proyecto

```typescript
// core/types/api.ts
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
```

---

## 9. Routing y Navegación

### Configuración con lazy loading

```tsx
// App.tsx
const Dashboard = lazy(() => import('./features/dashboard/pages/Dashboard'));
const POS       = lazy(() => import('./features/pos/pages/POS'));
const Inventory = lazy(() => import('./features/inventory/pages/Inventory'));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Suspense fallback={<FullPageSpinner />}><Login /></Suspense>} />

          <Route element={<Layout />}>
            <Route path="/" element={
              <RoleProtectedRoute roles={['admin', 'manager']}>
                <Suspense fallback={<FullPageSpinner />}>
                  <Dashboard />
                </Suspense>
              </RoleProtectedRoute>
            } />

            {/* ... más rutas */}
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

### Reglas de routing

- Cada feature expone **una sola página** como punto de entrada (`pages/FeaturePage.tsx`)
- Todas las rutas privadas pasan por `RoleProtectedRoute`
- Usar `<Navigate replace />` para redirecciones (no `window.location`)
- Los params de ruta van tipados: `useParams<{ id: string }>()`

---

## 10. Performance y Optimización

### Code splitting

```tsx
// ✅ Lazy loading — cada página es un chunk separado
const ProductsPage = lazy(() => import('./features/inventory/pages/Products'));

// ✅ Prefetch al hacer hover (mejora UX)
const prefetch = () => import('./features/inventory/pages/Products');
<Link onMouseEnter={prefetch} to="/inventory">Inventario</Link>
```

### Memoización — cuándo usarla

```tsx
// useMemo — solo para cálculos costosos con colecciones grandes
const totalInventoryValue = useMemo(
  () => products.reduce((sum, p) => sum + p.price * p.stock, 0),
  [products]
);

// useCallback — solo cuando la función va como prop o está en deps
const handleDelete = useCallback((id: string) => {
  deleteProduct(id);
}, [deleteProduct]);

// React.memo — solo en componentes que reciben props estables
export const ProductRow = React.memo(({ product, onEdit }) => { ... });

// ⚠️ NO memoizar indiscriminadamente — tiene costo propio
```

### Configuración de Vite (chunks)

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes('node_modules/react')) return 'react-vendor';
        if (id.includes('node_modules/bootstrap')) return 'bootstrap-vendor';
        if (id.includes('node_modules/@tanstack')) return 'query-vendor';
        if (id.includes('node_modules/jspdf')) return 'pdf-vendor'; // lazy
      }
    }
  },
  chunkSizeWarningLimit: 600
}
```

---

## 11. Estilos y UI

Stack de UI fijo: **Bootstrap 5 + react-bootstrap**. No mezclar con Tailwind ni otras librerías de componentes.

### Sistema de capas

```
Bootstrap 5 (base — variables, grid, utilidades)
    ↓
styles/custom.css (sobrescrituras de variables Bootstrap + clases propias)
    ↓
className en JSX (utilidades Bootstrap puntuales del componente)
```

### Importación en el proyecto

```typescript
// main.tsx — siempre en este orden
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/custom.css';              // Override DESPUÉS de Bootstrap
```

### Variables CSS — siempre personalizar sobre las de Bootstrap

```css
/* styles/custom.css */

/* 1. Sobrescribir variables Bootstrap antes de usarlas */
:root {
  /* Colores — usar los nombres de Bootstrap para mantener consistencia */
  --bs-primary:        #0d6efd;
  --bs-primary-rgb:    13, 110, 253;
  --bs-secondary:      #6c757d;
  --bs-success:        #198754;
  --bs-danger:         #dc3545;
  --bs-warning:        #ffc107;
  --bs-info:           #0dcaf0;

  /* Layout */
  --sidebar-width:     260px;
  --sidebar-collapsed: 64px;
  --header-height:     60px;

  /* Propios del proyecto */
  --transition-base:   0.25s ease;
  --radius-card:       0.5rem;
  --shadow-card:       0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 2. Clases de utilidad propias (que Bootstrap no cubre) */
.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cursor-pointer { cursor: pointer; }

.card-hover {
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}
.card-hover:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

/* 3. Sobrescrituras globales de componentes Bootstrap */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.table > :not(caption) > * > * {
  vertical-align: middle;
}
```

### Grid y layout — reglas de uso

```tsx
// ✅ Siempre Container fluid en páginas internas (ya tienen sidebar)
<Container fluid className="py-4">
  <Row className="g-3">          {/* g-3 = gap entre columnas */}
    <Col xs={12} md={6} lg={4}>
      {/* Diseño mobile-first: xs primero, luego breakpoints mayores */}
    </Col>
  </Row>
</Container>

// ✅ Container (no fluid) solo en páginas centradas como login
<Container className="py-5" style={{ maxWidth: 480 }}>
  ...
</Container>
```

### Breakpoints de referencia

| Clase | Pantalla | Ancho mínimo |
|---|---|---|
| `xs` | Móvil (default) | < 576px |
| `sm` | Móvil grande | ≥ 576px |
| `md` | Tablet | ≥ 768px |
| `lg` | Desktop | ≥ 992px |
| `xl` | Desktop grande | ≥ 1200px |
| `xxl` | Pantalla ancha | ≥ 1400px |

```tsx
// Ocultar/mostrar según pantalla
<div className="d-none d-md-block">Visible solo desde tablet</div>
<div className="d-md-none">Visible solo en móvil</div>
```

### Componentes Bootstrap más usados — patrones estándar

```tsx
import {
  Container, Row, Col,
  Card, Button, Form,
  Table, Badge, Alert,
  Modal, Spinner, InputGroup,
  Nav, Navbar, Dropdown,
  Pagination, Tab, Tabs
} from 'react-bootstrap';

// ── Card estándar de listado ──────────────────────────────
<Card className="shadow-sm">
  <Card.Header className="d-flex justify-content-between align-items-center">
    <h5 className="mb-0">Título</h5>
    <Button variant="primary" size="sm">
      <Plus size={16} className="me-1" />
      Nuevo
    </Button>
  </Card.Header>
  <Card.Body className="p-0">
    <Table hover responsive className="mb-0">
      <thead className="table-light">
        <tr>
          <th>Columna</th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.id}>
            <td>{item.name}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  </Card.Body>
</Card>

// ── Formulario estándar ───────────────────────────────────
<Form onSubmit={handleSubmit}>
  <Row className="g-3">
    <Col md={6}>
      <Form.Group>
        <Form.Label>Nombre <span className="text-danger">*</span></Form.Label>
        <Form.Control
          type="text"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          isInvalid={!!errors.name}
        />
        <Form.Control.Feedback type="invalid">
          {errors.name}
        </Form.Control.Feedback>
      </Form.Group>
    </Col>
  </Row>
</Form>

// ── Modal estándar ────────────────────────────────────────
<Modal show={showModal} onHide={handleClose} size="lg" centered>
  <Modal.Header closeButton>
    <Modal.Title>Título del Modal</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {/* contenido */}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
    <Button variant="primary" onClick={handleSave} disabled={isSaving}>
      {isSaving ? <Spinner size="sm" className="me-2" /> : null}
      Guardar
    </Button>
  </Modal.Footer>
</Modal>

// ── Búsqueda con InputGroup ───────────────────────────────
<InputGroup>
  <InputGroup.Text><Search size={16} /></InputGroup.Text>
  <Form.Control
    placeholder="Buscar..."
    value={search}
    onChange={e => setSearch(e.target.value)}
  />
  {search && (
    <Button variant="outline-secondary" onClick={() => setSearch('')}>
      <X size={16} />
    </Button>
  )}
</InputGroup>
```

### Variantes de Button — cuándo usar cada una

| Variante | Uso |
|---|---|
| `primary` | Acción principal de la vista (una sola por pantalla) |
| `secondary` | Cancelar, volver, acción neutral |
| `success` | Confirmar, aprobar, completar |
| `danger` | Eliminar, rechazar (siempre con confirmación) |
| `warning` | Alertas, acciones con consecuencias reversibles |
| `outline-*` | Acciones secundarias dentro de listas o cards |
| `link` | Acciones de mínimo impacto visual |

```tsx
// ✅ Botón de eliminar — siempre outline en tabla, nunca danger directo
<Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id)}>
  <Trash2 size={14} />
</Button>

// ✅ Botón principal de la página — uno solo, en el header
<Button variant="primary">
  <Plus size={18} className="me-1" />
  Nuevo Producto
</Button>
```

### Badges y estados

```tsx
// Mapear estados a variantes semánticas
const STATUS_VARIANT: Record<string, string> = {
  active:    'success',
  inactive:  'secondary',
  pending:   'warning',
  cancelled: 'danger',
  draft:     'light'
};

<Badge bg={STATUS_VARIANT[item.status]}>
  {item.status}
</Badge>
```

### Estados de carga y vacío — componentes compartidos obligatorios

```tsx
// shared/components/feedback/LoadingSpinner.tsx
export const LoadingSpinner: React.FC<{ text?: string }> = ({ text = 'Cargando...' }) => (
  <div className="d-flex justify-content-center align-items-center py-5">
    <Spinner animation="border" variant="primary" className="me-2" />
    <span className="text-muted">{text}</span>
  </div>
);

// shared/components/feedback/EmptyState.tsx
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="text-center py-5">
    {icon && <div className="text-muted mb-3">{icon}</div>}
    <h6 className="text-muted">{title}</h6>
    {description && <p className="text-muted small">{description}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);

// Uso en páginas
if (isLoading) return <LoadingSpinner />;

{products.length === 0 && (
  <EmptyState
    icon={<Package size={48} />}
    title="No se encontraron productos"
    description="Agregá un nuevo producto para comenzar"
    action={<Button variant="primary" onClick={() => setShowModal(true)}>Nuevo Producto</Button>}
  />
)}
```

### Iconos — lucide-react como estándar

```tsx
// ✅ Importar solo los íconos necesarios (tree-shakeable)
import { Plus, Edit, Trash2, Search, X, Package, ChevronDown } from 'lucide-react';

// ✅ Tamaños estándar según contexto
// 14px — dentro de botones pequeños (size="sm")
// 16px — botones normales, dentro de texto
// 18-20px — botones principales, headers de card
// 24px — íconos decorativos, empty states pequeños
// 32-48px — empty states grandes, ilustraciones

<Button size="sm"><Edit size={14} /></Button>
<Button><Plus size={18} className="me-1" />Nuevo</Button>
```

---

## 12. Seguridad Frontend

- **Nunca** guardar datos sensibles en `localStorage` excepto el token JWT
- **Siempre** sanitizar datos antes de renderizarlos en el DOM
- **Nunca** hardcodear credenciales, API keys ni URLs de producción en el código
- Usar `dangerouslySetInnerHTML` solo como último recurso y con sanitización previa
- Los tokens se deben renovar en el interceptor de respuesta, no en cada componente
- Proteger todas las rutas privadas con `RoleProtectedRoute`

---

## 13. Variables de Entorno

### Estructura requerida en todo proyecto

```bash
# .env.example — SIEMPRE incluir este archivo en el repositorio
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Mi Aplicación
VITE_APP_VERSION=1.0.0

# Opcional según proyecto
VITE_SENTRY_DSN=
VITE_MAPBOX_TOKEN=
```

### Reglas

- Solo variables con prefijo `VITE_` son accesibles en el cliente
- `.env.local` y `.env.production` van en `.gitignore`
- `.env.example` siempre en el repositorio con valores vacíos o de ejemplo
- Acceder siempre mediante `import.meta.env.VITE_*`

```typescript
// core/config.ts — centralizar acceso a env
export const config = {
  apiUrl:  import.meta.env.VITE_API_URL,
  appName: import.meta.env.VITE_APP_NAME ?? 'App',
  isDev:   import.meta.env.DEV
} as const;
```

---

## 14. Testing

### Qué testear y con qué

| Tipo | Herramienta | Prioridad |
|---|---|---|
| Hooks con lógica compleja | `@testing-library/react` + `renderHook` | Alta |
| Componentes de presentación | `@testing-library/react` | Media |
| Funciones utilitarias puras | `vitest` | Alta |
| Páginas completas | Cypress / Playwright (E2E) | Baja/Media |

### Test de un hook

```tsx
// hooks/useProducts.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryWrapper } from '../../../test/utils';
import { useProducts } from './useProducts';

describe('useProducts', () => {
  it('returns products after loading', async () => {
    const { result } = renderHook(() => useProducts(), {
      wrapper: createQueryWrapper()
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.products.length).toBeGreaterThan(0);
  });
});
```

### Test de un componente

```tsx
// components/ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';

const mockProduct = { id: '1', name: 'Tornillo 3/4"', retailPrice: 500, currentStock: 100, unit: 'unid' };

it('llama onEdit con el producto correcto', () => {
  const onEdit = vi.fn();
  render(<ProductCard product={mockProduct} onEdit={onEdit} onDelete={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  expect(onEdit).toHaveBeenCalledWith(mockProduct);
});
```

---

## 15. Checklist por Feature

Aplicar antes de hacer merge de cualquier feature nuevo.

### Arquitectura

- [ ] El código está en la carpeta correcta (`core` / `features` / `shared`)
- [ ] El feature no importa directamente de otro feature
- [ ] Los componentes tienen menos de 200 líneas
- [ ] Las páginas no contienen lógica de negocio (solo orquestación)
- [ ] Los hooks encapsulan toda la lógica de datos

### TypeScript

- [ ] Cero usos de `any`
- [ ] Todas las props tienen interfaces definidas
- [ ] Los tipos del dominio están en `core/types/api.ts`
- [ ] Los errores de API están tipados

### Estado

- [ ] Datos del servidor → React Query
- [ ] Estado de UI (modal, tab) → useState local
- [ ] Sin duplicación de estado entre componentes
- [ ] Arrays de dependencias en hooks son correctos y completos

### Performance

- [ ] Página cargada con `lazy()` y `Suspense`
- [ ] Componentes costosos envoltos en `React.memo`
- [ ] Listas de más de 100 items tienen virtualización
- [ ] Imágenes optimizadas (webp, dimensiones correctas)

### UX

- [ ] Estados de carga implementados
- [ ] Estados de error con mensaje claro
- [ ] Estados vacíos con mensaje y acción sugerida
- [ ] Feedback al usuario en mutaciones (toast de éxito/error)
- [ ] Diseño responsive verificado en mobile y desktop

### Código

- [ ] Sin `console.log` (reemplazar con logger si es necesario)
- [ ] Sin código comentado (usar git para historial)
- [ ] Nombres de variables/funciones descriptivos
- [ ] Imports organizados por categoría

---

## 16. Errores Comunes a Evitar

### Arquitectura

```
❌ Un feature importa de otro feature directamente
❌ Lógica de negocio dentro de un componente de página
❌ Componentes de más de 300 líneas sin separar
❌ Tipos definidos inline en lugar de en core/types
```

### Estado

```
❌ useState para datos que vienen del servidor
❌ Poner todo en Context porque "es más fácil"
❌ Olvidar limpiar efectos (setInterval, listeners)
❌ Mutar el estado directamente: state.items.push(x)
❌ Array de dependencias vacío [] cuando hay deps reales
```

### Performance

```
❌ useMemo/useCallback en componentes simples sin beneficio real
❌ index como key en listas dinámicas (causa bugs de reconciliación)
❌ Importar toda una librería cuando solo se usa una función
❌ Cargar todas las rutas de golpe sin lazy loading
```

### TypeScript

```
❌ Usar `any` para silenciar errores en lugar de tiparlo bien
❌ Usar type assertion (as X) para escapar del tipado
❌ No tipar los errores de catch: catch (e: any)
```

### Bootstrap / UI

```
❌ Mezclar Bootstrap con Tailwind u otras librerías de componentes
❌ Importar bootstrap.min.css DESPUÉS de custom.css (se pierden los overrides)
❌ Usar style={{ color: 'red' }} cuando existe una clase Bootstrap equivalente
❌ Crear clases CSS propias para cosas que Bootstrap ya resuelve
❌ Usar <div onClick> en lugar de <Button variant="link"> para acciones
❌ Omitir responsive: diseñar solo para desktop y agregar mobile al final
❌ Un mismo ícono con tamaños inconsistentes en la misma vista
```

### Seguridad

```
❌ Hardcodear URLs, tokens o credenciales en el código
❌ Guardar información sensible en localStorage
❌ No validar permisos en el frontend (solo en backend no alcanza)
❌ dangerouslySetInnerHTML sin sanitizar
```

---

## Recursos de Referencia

- [React Docs](https://react.dev/) — Documentación oficial
- [TanStack Query](https://tanstack.com/query/latest) — Server state
- [React Router](https://reactrouter.com/) — Routing
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) — Tipado
- [Vite Docs](https://vitejs.dev/) — Build tool
- [Bootstrap 5 Docs](https://getbootstrap.com/docs/5.3/) — Utilidades y componentes base
- [React Bootstrap Docs](https://react-bootstrap.github.io/) — Componentes React

---

**Mantener esta guía actualizada** cuando:
- Se incorpore una nueva dependencia mayor al stack
- Cambie un patrón arquitectónico de base
- Se identifique un error recurrente que deba prevenirse
- Se actualice una versión major de React, Router o Query
