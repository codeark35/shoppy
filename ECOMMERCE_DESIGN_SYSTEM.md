# ECOMMERCE PLATFORM — Design System v1.0
> Guía de Diseño Visual · Estilo Moderno Empresarial · Marzo 2026

---

## Filosofía de Diseño

El ecommerce debe proyectar **confianza, claridad y velocidad**. El usuario paraguayo compra principalmente desde el móvil, en conexiones variables, con tiempo limitado. Cada decisión de diseño responde a eso:

- **Confianza** → consistencia visual, tipografía sólida, espaciado generoso
- **Claridad** → jerarquía visual clara, CTAs obvios, precios prominentes
- **Velocidad** → componentes livianos, sin animaciones pesadas, imágenes optimizadas

El estilo es **Modern Corporate Commerce** — limpio, profesional, con personalidad propia. No genérico, no recargado.

---

## 1. Paleta de Colores

### Colores principales

```scss
// _variables.scss

// Brand
$color-primary:        #0F4C81;   // Azul marino profundo — confianza, profesionalismo
$color-primary-light:  #1A6BB5;   // Hover states, links
$color-primary-dark:   #0A3358;   // Active states, pressed
$color-accent:         #F97316;   // Naranja — CTAs principales, badges, urgencia

// Neutrales
$color-dark:           #111827;   // Textos principales
$color-body:           #374151;   // Textos secundarios / descripción
$color-muted:          #6B7280;   // Labels, placeholders, metadatos
$color-border:         #E5E7EB;   // Bordes de cards, inputs, dividers
$color-surface:        #F9FAFB;   // Fondos de secciones alternadas
$color-white:          #FFFFFF;   // Fondos principales

// Semánticos
$color-success:        #16A34A;   // Stock disponible, confirmaciones, éxito
$color-warning:        #D97706;   // Stock bajo, advertencias
$color-danger:         #DC2626;   // Errores, precio tachado, descuentos
$color-info:           #0284C7;   // Información, tooltips

// Admin (panel interno — tono más oscuro y denso)
$color-admin-bg:       #0F172A;   // Sidebar admin
$color-admin-surface:  #1E293B;   // Cards admin
$color-admin-border:   #334155;   // Bordes admin
$color-admin-text:     #CBD5E1;   // Texto admin
```

### Uso por contexto

| Elemento                    | Color                          |
|-----------------------------|--------------------------------|
| Botón primario (Comprar)    | `$color-accent` (#F97316)      |
| Botón secundario            | `$color-primary` (#0F4C81)     |
| Links y navegación          | `$color-primary-light`         |
| Precio principal            | `$color-dark` bold             |
| Precio tachado (original)   | `$color-muted` line-through    |
| Badge descuento             | `$color-danger` bg             |
| Badge "Nuevo"               | `$color-primary` bg            |
| Badge "Agotado"             | `$color-muted` bg              |
| Stock disponible            | `$color-success`               |
| Stock bajo (< 5 unidades)   | `$color-warning`               |

### Modo claro vs modo oscuro

El sistema implementa **solo modo claro** en v1. El modo oscuro se puede agregar en Fase 3 con CSS custom properties. No implementar ambos desde el inicio para no duplicar el trabajo de QA visual.

---

## 2. Tipografía

### Fuentes seleccionadas

```scss
// Importar en index.html via Google Fonts
// <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">

$font-display: 'Sora', sans-serif;    // Títulos, headings, precio destacado
$font-body:    'DM Sans', sans-serif; // Cuerpo de texto, labels, navegación
```

**Por qué estas fuentes:**
- **Sora** — geométrica moderna, excelente legibilidad en pantallas pequeñas, transmite solidez sin ser aburrida
- **DM Sans** — humanista, muy legible en tamaños pequeños, perfecta para descripciones y UI labels

### Escala tipográfica

```scss
// Tamaños base (rem — base 16px)
$text-xs:   0.75rem;   // 12px — labels, badges, metadata
$text-sm:   0.875rem;  // 14px — texto secundario, descripciones cortas
$text-base: 1rem;      // 16px — cuerpo de texto principal
$text-lg:   1.125rem;  // 18px — precio, destacados
$text-xl:   1.25rem;   // 20px — subtítulos de sección
$text-2xl:  1.5rem;    // 24px — títulos de card, nombre de producto
$text-3xl:  1.875rem;  // 30px — títulos de página
$text-4xl:  2.25rem;   // 36px — hero headline mobile
$text-5xl:  3rem;      // 48px — hero headline desktop

// Pesos
$font-regular:   400;
$font-medium:    500;
$font-semibold:  600;
$font-bold:      700;

// Line heights
$leading-tight:  1.25;  // Títulos
$leading-snug:   1.375; // Subtítulos
$leading-normal: 1.5;   // Cuerpo de texto
$leading-relaxed:1.625; // Descripciones largas
```

### Aplicación por elemento

| Elemento                  | Fuente      | Tamaño     | Peso       |
|---------------------------|-------------|------------|------------|
| Hero headline             | Sora        | 4xl / 5xl  | Bold 700   |
| Nombre de producto (card) | Sora        | lg         | Semibold   |
| Nombre de producto (detalle)| Sora      | 2xl / 3xl  | Bold       |
| Precio principal          | Sora        | 2xl        | Bold       |
| Precio tachado            | DM Sans     | base       | Regular    |
| Descripción de producto   | DM Sans     | sm / base  | Regular    |
| Labels de formulario      | DM Sans     | sm         | Medium     |
| Botones                   | DM Sans     | sm / base  | Semibold   |
| Navegación                | DM Sans     | sm         | Medium     |
| Badges / Tags             | DM Sans     | xs         | Semibold   |

---

## 3. Espaciado y Layout

### Sistema de espaciado (múltiplos de 4px)

```scss
$space-1:  0.25rem;  // 4px
$space-2:  0.5rem;   // 8px
$space-3:  0.75rem;  // 12px
$space-4:  1rem;     // 16px  ← unidad base
$space-5:  1.25rem;  // 20px
$space-6:  1.5rem;   // 24px
$space-8:  2rem;     // 32px
$space-10: 2.5rem;   // 40px
$space-12: 3rem;     // 48px
$space-16: 4rem;     // 64px
$space-20: 5rem;     // 80px
```

### Breakpoints (alineados con Bootstrap 5)

```scss
$bp-xs:  0px;
$bp-sm:  576px;
$bp-md:  768px;   // ← punto de quiebre principal mobile/desktop
$bp-lg:  992px;
$bp-xl:  1200px;
$bp-xxl: 1400px;
```

### Grid del catálogo

```
Mobile (< 576px):   1 columna
Tablet (576–991px): 2 columnas
Desktop (≥ 992px):  3 columnas
Wide (≥ 1200px):    4 columnas
```

### Contenedor máximo

```scss
$container-max: 1320px; // Bootstrap xxl — suficiente para catálogos densos
```

---

## 4. Componentes — Guía Visual

### 4.1 Product Card

La card de producto es el componente más crítico del ecommerce. Debe comunicar imagen, nombre, precio y CTA en menos de 2 segundos de lectura.

```
┌─────────────────────┐
│  [Badge descuento]  │  ← absoluto top-left, $color-danger
│                     │
│    [Imagen]         │  ← aspect-ratio 1:1, object-fit cover
│                     │
│  [Wishlist ♡]       │  ← absoluto top-right, hover fill
├─────────────────────┤
│ Categoría           │  ← xs, $color-muted, uppercase, letter-spacing
│ Nombre del producto │  ← lg, Sora semibold, 2 líneas max (line-clamp)
│                     │
│ ~~Gs. 150.000~~  -20%│  ← precio original tachado + badge descuento
│ Gs. 120.000         │  ← 2xl, Sora bold, $color-dark
│                     │
│ [Agregar al carrito]│  ← botón full-width, $color-accent
└─────────────────────┘
```

**CSS clave:**
```scss
.product-card {
  border: 1px solid $color-border;
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  background: $color-white;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.10);
    transform: translateY(-2px);
  }

  .product-card__image-wrapper {
    position: relative;
    aspect-ratio: 1 / 1;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    &:hover img {
      transform: scale(1.04);
    }
  }

  .product-card__body {
    padding: $space-4;
  }

  .product-card__category {
    font-size: $text-xs;
    font-weight: $font-semibold;
    color: $color-muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: $space-1;
  }

  .product-card__name {
    font-family: $font-display;
    font-size: $text-lg;
    font-weight: $font-semibold;
    color: $color-dark;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: $space-3;
  }

  .product-card__price {
    font-family: $font-display;
    font-size: $text-2xl;
    font-weight: $font-bold;
    color: $color-dark;
  }

  .product-card__price-original {
    font-size: $text-sm;
    color: $color-muted;
    text-decoration: line-through;
    margin-right: $space-2;
  }
}
```

### 4.2 Botones

```scss
// Botón primario — CTA principal (Comprar, Agregar al carrito)
.btn-primary-custom {
  background-color: $color-accent;
  border-color: $color-accent;
  color: $color-white;
  font-family: $font-body;
  font-weight: $font-semibold;
  padding: $space-3 $space-6;
  border-radius: 8px;
  transition: background 0.15s ease, transform 0.1s ease;

  &:hover {
    background-color: darken($color-accent, 8%);
    border-color: darken($color-accent, 8%);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

// Botón secundario — acciones secundarias
.btn-secondary-custom {
  background-color: transparent;
  border: 2px solid $color-primary;
  color: $color-primary;
  font-family: $font-body;
  font-weight: $font-semibold;
  padding: $space-3 $space-6;
  border-radius: 8px;

  &:hover {
    background-color: $color-primary;
    color: $color-white;
  }
}

// Botón ghost — acciones terciarias (Ver más, Cancelar)
.btn-ghost-custom {
  background-color: transparent;
  border: none;
  color: $color-primary-light;
  font-family: $font-body;
  font-weight: $font-medium;
  padding: $space-2 $space-4;

  &:hover {
    color: $color-primary-dark;
    text-decoration: underline;
  }
}
```

### 4.3 Badges

```scss
.badge-discount   { background: $color-danger;  color: white; }  // -20%
.badge-new        { background: $color-primary; color: white; }  // Nuevo
.badge-featured   { background: $color-accent;  color: white; }  // Destacado
.badge-out-stock  { background: $color-muted;   color: white; }  // Agotado
.badge-low-stock  { background: $color-warning; color: white; }  // Últimas unidades

// Todos los badges
[class^="badge-"] {
  font-family: $font-body;
  font-size: $text-xs;
  font-weight: $font-semibold;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
```

### 4.4 Inputs y Formularios

```scss
.form-control-custom {
  border: 1.5px solid $color-border;
  border-radius: 8px;
  padding: $space-3 $space-4;
  font-family: $font-body;
  font-size: $text-base;
  color: $color-dark;
  background: $color-white;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &::placeholder {
    color: $color-muted;
  }

  &:focus {
    border-color: $color-primary-light;
    box-shadow: 0 0 0 3px rgba($color-primary, 0.12);
    outline: none;
  }

  &.is-invalid {
    border-color: $color-danger;
    box-shadow: 0 0 0 3px rgba($color-danger, 0.12);
  }
}

.form-label-custom {
  font-family: $font-body;
  font-size: $text-sm;
  font-weight: $font-medium;
  color: $color-body;
  margin-bottom: $space-2;
}
```

### 4.5 Navbar (Tienda)

```
Desktop:
┌──────────────────────────────────────────────────────────┐
│  [Logo]    Categorías ▾    Ofertas    [🔍 Buscar...]    [♡][🛒 2] [Cuenta ▾] │
└──────────────────────────────────────────────────────────┘
bg: white | border-bottom: 1px solid $color-border | sticky top-0 | z-index: 1000

Mobile:
┌─────────────────────────────┐
│  [☰]    [Logo]    [🔍][🛒]  │
└─────────────────────────────┘
```

**Bottom Navigation (mobile < 768px):**
```
┌────────────────────────────────────────┐
│  [🏠]      [📦]      [🛒 •]    [👤]   │
│  Inicio  Catálogo  Carrito   Cuenta    │
└────────────────────────────────────────┘
bg: white | border-top: 1px solid $color-border | position: fixed bottom-0
```

```scss
.bottom-nav {
  display: none;

  @media (max-width: #{$bp-md - 1px}) {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: $color-white;
    border-top: 1px solid $color-border;
    padding: $space-2 0;
    padding-bottom: calc($space-2 + env(safe-area-inset-bottom)); // iOS notch

    .bottom-nav__item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      color: $color-muted;
      font-size: $text-xs;
      font-weight: $font-medium;
      text-decoration: none;
      padding: $space-1;

      &.active {
        color: $color-primary;
      }

      .cart-dot {
        position: relative;
        &::after {
          content: '';
          position: absolute;
          top: -2px;
          right: -4px;
          width: 8px;
          height: 8px;
          background: $color-accent;
          border-radius: 50%;
          border: 1.5px solid white;
        }
      }
    }
  }
}
```

---

## 5. Páginas — Layout y Jerarquía Visual

### 5.1 Home Page

```
[Navbar]
─────────────────────────────────────
[Hero Banner]
  Imagen de fondo full-width
  Headline + subtítulo + CTA principal
  height: 480px desktop / 300px mobile
─────────────────────────────────────
[Categorías destacadas]
  Grid horizontal scrollable en mobile
  4–6 categorías con imagen + nombre
─────────────────────────────────────
[Productos destacados]
  Título de sección + "Ver todos →"
  Grid de productos (4 desktop / 2 mobile)
─────────────────────────────────────
[Banner promocional]
  Full-width, color de fondo $color-primary
  Texto + CTA en accent
─────────────────────────────────────
[Productos en oferta]
  Mismo patrón que destacados
─────────────────────────────────────
[Footer]
[Bottom Nav - solo mobile]
```

### 5.2 Página de Catálogo

```
Desktop:
┌─────────────┬──────────────────────────────────┐
│  Filtros    │  [Breadcrumb]  [Ordenar por ▾]   │
│  ─────────  │  ─────────────────────────────── │
│  Categoría  │  [Card][Card][Card][Card]         │
│  Precio     │  [Card][Card][Card][Card]         │
│  Marca      │  [Card][Card][Card][Card]         │
│  Stock      │  ─────────────────────────────── │
│             │  [Paginación]                    │
└─────────────┴──────────────────────────────────┘
Sidebar: 260px fijo | Contenido: flex-1

Mobile:
[Filtros ▾] [Ordenar ▾]  ← botones que abren Offcanvas
[Grid 2 columnas]
[Paginación]
```

### 5.3 Página de Detalle de Producto

```
Desktop:
┌──────────────────┬──────────────────────────────┐
│  [Galería]       │  Categoría                   │
│  Imagen principal│  Nombre del producto (3xl)   │
│                  │  ★★★★☆ (23 reseñas)          │
│  [Miniaturas]    │  ──────────────────────────  │
│                  │  ~~Gs. 150.000~~  -20%        │
│                  │  Gs. 120.000                  │
│                  │  ──────────────────────────  │
│                  │  Color: [●][●][●]             │
│                  │  Talle: [S][M][L][XL]         │
│                  │  ──────────────────────────  │
│                  │  Cantidad: [−][1][+]           │
│                  │  [Agregar al carrito] (accent)│
│                  │  [Comprar ahora]    (primary) │
│                  │  ──────────────────────────  │
│                  │  ✓ Stock disponible           │
│                  │  🚚 Envío a todo el país      │
└──────────────────┴──────────────────────────────┘
Galería: 50% | Info: 50%

[Descripción completa] | [Especificaciones] | [Reseñas]  ← Tabs
```

### 5.4 Checkout (flujo en pasos)

```
[Paso 1: Dirección]  →  [Paso 2: Envío]  →  [Paso 3: Pago]  →  [Confirmación]

Progress bar en el top con los 3 pasos
Formulario a la izquierda (2/3) | Resumen del carrito a la derecha (1/3)
En mobile: resumen colapsable arriba, formulario abajo
```

---

## 6. Panel de Administración

El panel admin tiene una identidad visual separada de la tienda pública — más denso, dark sidebar, orientado a productividad.

### Layout admin

```
┌──────────────┬──────────────────────────────────────────────┐
│  [Logo]      │  [Breadcrumb]    [Notif 🔔]  [Admin ▾]       │
│  ──────────  ├──────────────────────────────────────────────┤
│  Dashboard   │                                              │
│  Productos   │              CONTENIDO PRINCIPAL             │
│  Categorías  │                                              │
│  Pedidos ●   │                                              │
│  Clientes    │                                              │
│  Inventario  │                                              │
│  Reportes    │                                              │
│  ──────────  │                                              │
│  Config      │                                              │
└──────────────┴──────────────────────────────────────────────┘
Sidebar: 240px | bg: $color-admin-bg | texto: $color-admin-text
Header: bg: white | border-bottom | height: 64px
```

### Colores admin

```scss
// El sidebar usa la paleta oscura definida anteriormente
// Las cards del dashboard usan la paleta clara estándar

.admin-stat-card {
  background: $color-white;
  border: 1px solid $color-border;
  border-radius: 12px;
  padding: $space-6;

  .stat-value {
    font-family: $font-display;
    font-size: $text-3xl;
    font-weight: $font-bold;
    color: $color-dark;
  }

  .stat-label {
    font-size: $text-sm;
    color: $color-muted;
    margin-top: $space-1;
  }

  .stat-change.positive { color: $color-success; }
  .stat-change.negative { color: $color-danger; }
}
```

### Vista de órdenes (panel depósito)

```
Tabs: [PAID (12)] [PREPARING (5)] [READY TO SHIP (3)] [SHIPPED (8)]

Tabla:
┌────────┬──────────┬─────────────┬──────────┬──────────┬─────────────┐
│ #Orden │ Cliente  │ Productos   │ Total    │ Tiempo   │ Acción      │
├────────┼──────────┼─────────────┼──────────┼──────────┼─────────────┤
│ #1042  │ Juan P.  │ 3 items     │ Gs 85k   │ 2h ago   │ [Preparar →]│
│ #1041  │ María G. │ 1 item      │ Gs 45k   │ 3h ago   │ [Preparar →]│
└────────┴──────────┴─────────────┴──────────┴──────────┴─────────────┘
```

---

## 7. Micro-interacciones y Animaciones

Regla general: **animaciones rápidas y funcionales**. No decorativas. El usuario en mobile con conexión lenta no debe sentir que la UI es pesada.

```scss
// Duraciones estándar
$duration-fast:   100ms;  // feedback inmediato (click, toggle)
$duration-base:   200ms;  // hover states, transiciones de color
$duration-smooth: 300ms;  // slides, modals, drawers
$duration-slow:   400ms;  // page transitions (solo si hay)

// Easings
$ease-out:    cubic-bezier(0.0, 0.0, 0.2, 1);  // elementos entrando
$ease-in:     cubic-bezier(0.4, 0.0, 1, 1);    // elementos saliendo
$ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1);  // transiciones de estado
```

### Animaciones específicas

```scss
// Botón de "Agregar al carrito" — feedback de éxito
@keyframes cart-bounce {
  0%   { transform: scale(1); }
  40%  { transform: scale(0.95); }
  70%  { transform: scale(1.05); }
  100% { transform: scale(1); }
}

// Toast / notificación entrando desde arriba
@keyframes slide-down {
  from { transform: translateY(-16px); opacity: 0; }
  to   { transform: translateY(0);     opacity: 1; }
}

// Skeleton loading (productos cargando)
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
}
```

### Qué sí animar
- Hover en cards (sombra + leve translateY)
- Apertura de Offcanvas del carrito (slide from right)
- Toast de confirmación "Producto agregado"
- Skeleton loading del catálogo
- Transición de estados en botones (loading spinner al procesar)

### Qué NO animar
- Cambios de página (el router no necesita transiciones)
- Cada campo de formulario individualmente
- Imágenes de productos al cargar
- El navbar al hacer scroll (sin efecto parallax ni shrink)

---

## 8. Iconografía — Lucide React

Usar exclusivamente **Lucide React**. Tamaños estándar:

| Contexto                        | Tamaño  | Stroke  |
|---------------------------------|---------|---------|
| Navbar (carrito, cuenta, buscar)| 22px    | 1.75    |
| Bottom navigation mobile        | 24px    | 1.75    |
| Dentro de botones               | 16px    | 2       |
| Badges de características       | 16px    | 2       |
| Dashboard admin (stat cards)    | 28px    | 1.5     |
| Sidebar admin                   | 18px    | 1.75    |
| Estados vacíos (empty state)    | 48px    | 1.25    |

### Íconos clave del sistema

```tsx
import {
  ShoppingCart,    // carrito
  Heart,           // wishlist
  Search,          // búsqueda
  User,            // cuenta
  Home,            // inicio
  Package,         // catálogo / pedidos
  ChevronRight,    // navegación
  ChevronDown,     // dropdowns
  X,               // cerrar
  Plus, Minus,     // cantidad
  Truck,           // envío
  CheckCircle,     // confirmación / stock
  AlertCircle,     // advertencias
  Star,            // rating
  Filter,          // filtros
  SlidersHorizontal, // ordenar
  Eye,             // ver detalle
  Edit2,           // editar (admin)
  Trash2,          // eliminar (admin)
  BarChart2,       // reportes (admin)
  Bell,            // notificaciones (admin)
  LogOut,          // cerrar sesión
} from 'lucide-react'
```

---

## 9. Imágenes y Media

### Formatos y tamaños

```
Productos:
  Thumbnail (grid catálogo):  400x400px  WebP  < 40KB
  Principal (detalle):        800x800px  WebP  < 120KB
  Zoom (galería):            1200x1200px WebP  < 250KB

Banners hero:
  Desktop:  1440x480px  WebP  < 200KB
  Mobile:    768x400px  WebP  < 100KB

Categorías:
  Card:      400x300px  WebP  < 50KB
```

### Convención de nombres en Cloudflare R2

```
products/{productId}/thumb.webp
products/{productId}/main.webp
products/{productId}/gallery-1.webp
products/{productId}/gallery-2.webp
banners/{bannerId}/desktop.webp
banners/{bannerId}/mobile.webp
categories/{categoryId}/cover.webp
```

### Lazy loading obligatorio

```tsx
// Todas las imágenes de productos usan loading="lazy"
<img
  src={product.imageUrl}
  alt={product.name}
  loading="lazy"
  decoding="async"
  width={400}
  height={400}
/>
```

---

## 10. Accesibilidad (A11y)

Requisitos mínimos para v1:

- Contraste de color mínimo **4.5:1** para texto normal, **3:1** para texto grande
- Todos los botones e inputs tienen `aria-label` cuando no tienen texto visible
- El carrito muestra la cantidad con `aria-live="polite"` para lectores de pantalla
- Focus visible en todos los elementos interactivos (`outline` no eliminado, customizado)
- Los modales/offcanvas atrapan el foco mientras están abiertos (`focus trap`)
- Navegación por teclado funcional en el menú de categorías

```scss
// Focus ring custom (reemplaza el default del browser)
:focus-visible {
  outline: 2px solid $color-primary-light;
  outline-offset: 2px;
  border-radius: 4px;
}

// Eliminar outline solo para mouse (no para teclado)
:focus:not(:focus-visible) {
  outline: none;
}
```

---

## 11. Formato de Precios (Paraguay)

```typescript
// utils/formatPrice.ts
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
  // Output: "Gs. 120.000"
}

// Para precios compactos en badges
export function formatPriceCompact(amount: number): string {
  if (amount >= 1_000_000) return `Gs. ${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000)     return `Gs. ${(amount / 1_000).toFixed(0)}k`
  return `Gs. ${amount}`
}
```

---

## 12. Variables SCSS — Archivo Central

```scss
// src/styles/_variables.scss
// Importar en main.scss ANTES de Bootstrap

// Override Bootstrap con las variables del sistema
$primary:   #0F4C81;
$secondary: #374151;
$success:   #16A34A;
$warning:   #D97706;
$danger:    #DC2626;
$info:      #0284C7;
$light:     #F9FAFB;
$dark:      #111827;

$font-family-sans-serif: 'DM Sans', system-ui, sans-serif;
$headings-font-family:   'Sora', system-ui, sans-serif;
$font-size-base:         1rem;
$line-height-base:       1.5;

$border-radius:    8px;
$border-radius-lg: 12px;
$border-radius-sm: 4px;

$box-shadow:    0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
$box-shadow-lg: 0 8px 24px rgba(0,0,0,0.10);

$transition-base: all 0.2s ease;

// main.scss
@import 'variables';
@import '~bootstrap/scss/bootstrap';
@import 'components/cards';
@import 'components/buttons';
@import 'components/navbar';
@import 'components/bottom-nav';
@import 'components/badges';
@import 'components/forms';
@import 'utilities';
```

---

*Fin del documento — Equipo Labscore · Design System v1.0*
