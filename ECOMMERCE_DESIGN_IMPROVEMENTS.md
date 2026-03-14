# MEJORAS DE DISEÑO — Ecommerce Platform
> Instrucciones para el agente · Rediseño visual completo · Marzo 2026

## Referencia visual objetivo
Estilo empresarial tipo **Nissei.com.py** — limpio, confiable, denso en información, 
totalmente responsivo. No minimalista vacío, sino profesional y funcional.

---

## Problemas actuales a corregir

1. Las cards muestran rectángulos de color sólido en lugar de imágenes reales
2. El diseño no es responsivo — no se adapta correctamente a mobile
3. Falta jerarquía visual clara entre elementos
4. El navbar es demasiado simple
5. No hay feedback visual de hover ni micro-interacciones
6. Los precios no tienen suficiente prominencia
7. Falta estructura en la HomePage (solo grid de productos sin secciones)

---

## 1. ProductCard — Rediseño completo

### Problema actual
La imagen se reemplaza con un `div` de color sólido con el nombre del producto centrado.
Esto debe eliminarse completamente.

### Implementación correcta

```tsx
// features/catalog/components/ProductCard.tsx

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="product-card">
      {/* Imagen real — siempre con fallback */}
      <div className="product-card__image-wrapper">
        {product.discountPercent > 0 && (
          <span className="product-card__badge-discount">
            -{product.discountPercent}%
          </span>
        )}
        <button className="product-card__wishlist" aria-label="Agregar a favoritos">
          <Heart size={16} />
        </button>
        <img
          src={product.mainImage ?? '/placeholder-product.png'}
          alt={product.name}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Info */}
      <div className="product-card__body">
        <span className="product-card__category">{product.categoryName}</span>
        <h3 className="product-card__name">{product.name}</h3>

        <div className="product-card__pricing">
          {product.originalPrice && (
            <span className="product-card__price-original">
              {formatPrice(product.originalPrice)}
            </span>
          )}
          <span className="product-card__price">
            {formatPrice(product.price)}
          </span>
        </div>

        <button className="btn btn-accent w-100 product-card__cta">
          <ShoppingCart size={15} />
          Agregar al carrito
        </button>
      </div>
    </div>
  )
}
```

### CSS — `_product-card.scss`

```scss
.product-card {
  border: 1px solid $color-border;
  border-radius: 10px;
  overflow: hidden;
  background: $color-white;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.10);
    transform: translateY(-3px);
  }

  // ── Imagen ──────────────────────────────────────────────
  &__image-wrapper {
    position: relative;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    background: #F8FAFC; // fondo neutro mientras carga

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;   // contain para productos, no cover
      padding: 8px;
      transition: transform 0.3s ease;
    }

    &:hover img {
      transform: scale(1.06);
    }
  }

  // ── Badges ──────────────────────────────────────────────
  &__badge-discount {
    position: absolute;
    top: 8px;
    left: 8px;
    background: $color-danger;
    color: white;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 4px;
    z-index: 1;
    font-family: $font-body;
  }

  &__wishlist {
    position: absolute;
    top: 8px;
    right: 8px;
    background: white;
    border: 1px solid $color-border;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1;
    transition: all 0.15s ease;
    color: $color-muted;

    &:hover, &.active {
      background: #FFF0F0;
      border-color: $color-danger;
      color: $color-danger;
    }
  }

  // ── Body ────────────────────────────────────────────────
  &__body {
    padding: 12px;
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 4px;
  }

  &__category {
    font-size: 0.68rem;
    font-weight: 600;
    color: $color-muted;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__name {
    font-family: $font-display;
    font-size: 0.875rem;
    font-weight: 600;
    color: $color-dark;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0;
    flex: 1;
  }

  // ── Pricing ─────────────────────────────────────────────
  &__pricing {
    display: flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 4px;
  }

  &__price {
    font-family: $font-display;
    font-size: 1.1rem;
    font-weight: 700;
    color: $color-dark;
  }

  &__price-original {
    font-size: 0.78rem;
    color: $color-muted;
    text-decoration: line-through;
  }

  // ── CTA ─────────────────────────────────────────────────
  &__cta {
    margin-top: 8px;
    font-size: 0.8rem;
    padding: 7px 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: 7px;
  }
}
```

---

## 2. Navbar — Rediseño empresarial

### Estructura objetivo (inspirado en Nissei)

```
┌──────────────────────────────────────────────────────────────────┐
│  TOPBAR: "Envíos a todo el país 🚚  |  WhatsApp: +595 xxx xxx"  │  ← bg oscuro, texto blanco, xs
├──────────────────────────────────────────────────────────────────┤
│  [Logo + nombre]    [Buscador amplio full-width]    [♡][🛒 2][👤]│  ← bg blanco, h: 68px
├──────────────────────────────────────────────────────────────────┤
│  [☰ Categorías ▾]  Inicio  Ofertas  Novedades  Contacto         │  ← bg $primary, texto blanco
└──────────────────────────────────────────────────────────────────┘
```

### CSS — `_navbar.scss`

```scss
// Topbar
.topbar {
  background: $color-dark;
  color: rgba(255,255,255,0.8);
  font-size: 0.75rem;
  padding: 6px 0;
  text-align: center;

  a { color: rgba(255,255,255,0.9); text-decoration: none; }

  @media (max-width: 767px) { display: none; } // ocultar en mobile
}

// Navbar principal
.main-navbar {
  background: $color-white;
  border-bottom: 1px solid $color-border;
  padding: 12px 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);

  .navbar-brand {
    font-family: $font-display;
    font-size: 1.3rem;
    font-weight: 700;
    color: $color-primary;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  // Buscador
  .search-wrapper {
    flex: 1;
    max-width: 560px;
    position: relative;

    input {
      border: 1.5px solid $color-border;
      border-radius: 8px;
      padding: 9px 16px 9px 42px;
      width: 100%;
      font-size: 0.9rem;
      transition: border-color 0.15s;

      &:focus {
        border-color: $color-primary-light;
        box-shadow: 0 0 0 3px rgba($color-primary, 0.10);
        outline: none;
      }
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: $color-muted;
    }
  }

  // Íconos de acción
  .nav-actions {
    display: flex;
    align-items: center;
    gap: 8px;

    .nav-action-btn {
      position: relative;
      background: none;
      border: none;
      padding: 8px;
      border-radius: 8px;
      color: $color-dark;
      cursor: pointer;
      transition: background 0.15s;

      &:hover { background: $color-surface; }

      .badge-count {
        position: absolute;
        top: 2px;
        right: 2px;
        background: $color-accent;
        color: white;
        font-size: 0.6rem;
        font-weight: 700;
        min-width: 16px;
        height: 16px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 3px;
      }
    }
  }
}

// Barra de categorías
.category-navbar {
  background: $color-primary;
  padding: 0;

  .nav-link {
    color: rgba(255,255,255,0.9) !important;
    font-size: 0.85rem;
    font-weight: 500;
    padding: 10px 16px !important;
    transition: background 0.15s;

    &:hover { background: rgba(255,255,255,0.12); }
  }

  .categories-btn {
    background: rgba(0,0,0,0.2);
    color: white;
    font-weight: 600;
    border: none;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
  }
}
```

---

## 3. HomePage — Estructura completa

La HomePage actual solo tiene un grid de productos. Debe tener secciones bien diferenciadas:

```tsx
// pages/HomePage.tsx

export function HomePage() {
  return (
    <>
      {/* 1. Hero banner */}
      <HeroBanner />

      {/* 2. Categorías destacadas — scroll horizontal en mobile */}
      <section className="py-4 bg-light">
        <div className="container">
          <SectionTitle title="Categorías" />
          <CategoryGrid />
        </div>
      </section>

      {/* 3. Productos destacados */}
      <section className="py-5">
        <div className="container">
          <SectionTitle title="Productos Destacados" linkText="Ver todos" linkTo="/catalogo" />
          <FeaturedProducts />
        </div>
      </section>

      {/* 4. Banner promocional */}
      <PromoBanner />

      {/* 5. Ofertas */}
      <section className="py-5 bg-light">
        <div className="container">
          <SectionTitle title="Ofertas" linkText="Ver todas" linkTo="/catalogo?ofertas=true" />
          <OffersProducts />
        </div>
      </section>
    </>
  )
}
```

### CSS — `_hero.scss`

```scss
.hero-banner {
  position: relative;
  height: 420px;
  background: linear-gradient(135deg, $color-primary 0%, $color-primary-dark 60%, #0a2540 100%);
  display: flex;
  align-items: center;
  overflow: hidden;

  @media (max-width: 767px) { height: 260px; }

  &__content {
    position: relative;
    z-index: 2;
    color: white;
  }

  &__eyebrow {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: $color-accent;
    margin-bottom: 8px;
  }

  &__title {
    font-family: $font-display;
    font-size: 2.8rem;
    font-weight: 700;
    line-height: 1.15;
    margin-bottom: 16px;

    @media (max-width: 767px) { font-size: 1.8rem; }
  }

  &__subtitle {
    font-size: 1rem;
    color: rgba(255,255,255,0.8);
    margin-bottom: 28px;
  }

  // Decoración geométrica de fondo
  &::after {
    content: '';
    position: absolute;
    right: -60px;
    top: -60px;
    width: 500px;
    height: 500px;
    background: rgba(255,255,255,0.04);
    border-radius: 50%;
  }
}
```

### SectionTitle component

```tsx
// shared/components/SectionTitle.tsx
export function SectionTitle({ title, linkText, linkTo }: Props) {
  return (
    <div className="section-title">
      <h2 className="section-title__text">{title}</h2>
      {linkText && <Link to={linkTo} className="section-title__link">{linkText} →</Link>}
    </div>
  )
}
```

```scss
.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid $color-border;

  &__text {
    font-family: $font-display;
    font-size: 1.25rem;
    font-weight: 700;
    color: $color-dark;
    margin: 0;

    &::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 20px;
      background: $color-accent;
      border-radius: 2px;
      margin-right: 10px;
      vertical-align: middle;
    }
  }

  &__link {
    font-size: 0.85rem;
    font-weight: 600;
    color: $color-primary-light;
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }
}
```

---

## 4. Responsividad — Reglas obligatorias

### Grid de productos

```scss
.products-grid {
  display: grid;
  gap: 16px;

  // Mobile: 2 columnas siempre (nunca 1 — ocupa demasiado vertical)
  grid-template-columns: repeat(2, 1fr);

  // Tablet
  @media (min-width: 576px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  // Desktop
  @media (min-width: 992px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  // Wide
  @media (min-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
}
```

### Bottom Navigation (mobile)

```scss
.bottom-nav {
  display: none;

  @media (max-width: 767px) {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: $color-white;
    border-top: 1px solid $color-border;
    padding: 6px 0;
    // Soporte para notch iOS
    padding-bottom: calc(6px + env(safe-area-inset-bottom));
  }

  &__item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    color: $color-muted;
    font-size: 0.65rem;
    font-weight: 500;
    text-decoration: none;
    padding: 4px 0;

    &.active {
      color: $color-primary;

      svg { stroke-width: 2.5; }
    }
  }
}

// Agregar padding al body en mobile para que el contenido no quede detrás del bottom nav
body {
  @media (max-width: 767px) {
    padding-bottom: calc(60px + env(safe-area-inset-bottom));
  }
}
```

### Navbar en mobile

```scss
// Ocultar la barra de categorías en mobile
.category-navbar {
  @media (max-width: 767px) { display: none; }
}

// El buscador en mobile: ocupa toda la línea
.main-navbar {
  @media (max-width: 767px) {
    .search-wrapper {
      order: 3;
      max-width: 100%;
      width: 100%;
      margin-top: 8px;
    }
  }
}
```

---

## 5. Imagen placeholder mientras no hay foto real

Crear el archivo `public/placeholder-product.png` — un rectángulo gris claro con ícono de imagen centrado. Mientras el agente no tenga imágenes reales de producto, usar este placeholder en lugar de los rectángulos de color sólido.

Alternativa con CSS puro (sin necesidad de archivo):

```scss
.product-card__image-wrapper {
  // Si la imagen falla o no existe
  img {
    &[src=""], &:not([src]) {
      visibility: hidden;
    }
  }

  // Ícono placeholder cuando no hay imagen
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: #F1F5F9 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23CBD5E1' stroke-width='1.5'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpath d='m21 15-5-5L5 21'/%3E%3C/svg%3E") center / 48px no-repeat;
    z-index: 0;
  }

  img { position: relative; z-index: 1; }
}
```

---

## 6. Página de detalle — mejoras

```scss
.product-detail {
  &__gallery {
    // Imagen principal
    .main-image {
      aspect-ratio: 1 / 1;
      border: 1px solid $color-border;
      border-radius: 10px;
      overflow: hidden;
      background: #F8FAFC;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        padding: 16px;
      }
    }

    // Miniaturas
    .thumbnails {
      display: flex;
      gap: 8px;
      margin-top: 10px;
      flex-wrap: wrap;

      .thumb {
        width: 64px;
        height: 64px;
        border: 2px solid $color-border;
        border-radius: 6px;
        overflow: hidden;
        cursor: pointer;
        background: #F8FAFC;

        &.active { border-color: $color-primary; }

        img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }
      }
    }
  }

  &__info {
    .product-name {
      font-family: $font-display;
      font-size: 1.6rem;
      font-weight: 700;
      color: $color-dark;
      line-height: 1.25;

      @media (max-width: 767px) { font-size: 1.25rem; }
    }

    .product-price {
      font-family: $font-display;
      font-size: 1.8rem;
      font-weight: 700;
      color: $color-dark;
    }

    .stock-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      font-weight: 600;

      &.in-stock { color: $color-success; }
      &.low-stock { color: $color-warning; }
      &.out-stock { color: $color-danger; }
    }

    // Selector de variantes (talle, color)
    .variant-selector {
      .variant-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: $color-body;
        margin-bottom: 8px;
      }

      .variant-options {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        .variant-btn {
          min-width: 40px;
          padding: 6px 12px;
          border: 1.5px solid $color-border;
          border-radius: 6px;
          background: white;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;

          &:hover { border-color: $color-primary-light; }
          &.active {
            border-color: $color-primary;
            background: $color-primary;
            color: white;
          }
          &:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            text-decoration: line-through;
          }
        }
      }
    }

    // Selector de cantidad
    .quantity-selector {
      display: flex;
      align-items: center;
      gap: 0;
      border: 1.5px solid $color-border;
      border-radius: 8px;
      overflow: hidden;
      width: fit-content;

      button {
        width: 38px;
        height: 40px;
        border: none;
        background: $color-surface;
        font-size: 1.1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s;

        &:hover { background: $color-border; }
      }

      input {
        width: 48px;
        height: 40px;
        border: none;
        border-left: 1.5px solid $color-border;
        border-right: 1.5px solid $color-border;
        text-align: center;
        font-size: 0.95rem;
        font-weight: 600;
        outline: none;
      }
    }
  }
}
```

---

## 7. Skeleton Loading — mientras cargan los productos

```scss
@keyframes shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}

.skeleton {
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 600px 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 6px;
}

// Card skeleton
.product-card-skeleton {
  border: 1px solid $color-border;
  border-radius: 10px;
  overflow: hidden;

  .img-skeleton {
    aspect-ratio: 1 / 1;
    @extend .skeleton;
  }

  .body-skeleton {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .line { height: 12px; @extend .skeleton; }
    .line-short { width: 60%; }
    .line-price { height: 18px; width: 50%; @extend .skeleton; }
    .btn-skeleton { height: 36px; border-radius: 7px; @extend .skeleton; }
  }
}
```

Uso en React:
```tsx
// Mostrar 8 skeletons mientras carga el catálogo
{isLoading && Array.from({ length: 8 }).map((_, i) => (
  <div key={i} className="product-card-skeleton">
    <div className="img-skeleton" />
    <div className="body-skeleton">
      <div className="line line-short" />
      <div className="line" />
      <div className="line-price" />
      <div className="btn-skeleton" />
    </div>
  </div>
))}
```

---

## 8. Resumen de archivos a modificar / crear

| Archivo | Acción |
|---|---|
| `features/catalog/components/ProductCard.tsx` | Reemplazar completamente |
| `styles/_product-card.scss` | Reemplazar completamente |
| `styles/_navbar.scss` | Reemplazar completamente |
| `styles/_hero.scss` | Crear nuevo |
| `styles/_section-title.scss` | Crear nuevo |
| `styles/_bottom-nav.scss` | Reemplazar completamente |
| `styles/_skeleton.scss` | Crear nuevo |
| `pages/HomePage.tsx` | Agregar estructura de secciones |
| `shared/components/SectionTitle.tsx` | Crear nuevo |
| `styles/main.scss` | Importar los nuevos archivos |

---

## Criterio de aceptación visual

El resultado debe verse comparable a **nissei.com.py**:
- Navbar con 3 niveles (topbar + logo/search + categorías)
- Cards con imagen real (o placeholder gris neutro), precio prominent, CTA naranja
- Grid de 2 columnas en mobile, 4 en desktop
- Bottom navigation fija en mobile
- Skeleton loading al navegar el catálogo
- Sin rectángulos de colores sólidos en ninguna parte

---

*Equipo Labscore · Mejoras de diseño v1.0*
