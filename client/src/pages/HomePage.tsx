import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { ShoppingBag, Tag } from 'lucide-react';
import { AppNavbar } from '../shared/components/AppNavbar';
import { BottomNav } from '../shared/components/BottomNav';
import { SectionTitle } from '../shared/components/SectionTitle';
import { ProductGrid } from '../features/catalog/components/ProductGrid';
import { useCategories } from '../features/catalog/hooks/useProducts';

// ── Hero ────────────────────────────────────────────────────────────────────
function HeroBanner() {
  return (
    <div className="hero-banner">
      <div className="hero-banner__mesh" aria-hidden />
      <div className="hero-banner__grain" aria-hidden />
      <div className="hero-banner__deco" aria-hidden />
      <Container fluid="xl">
        <div className="hero-banner__content">
          <div className="hero-banner__eyebrow">
            <span className="eyebrow-dot" />
            Nueva temporada 2026
          </div>
          <h1 className="hero-banner__title">
            Todo lo que necesitás,<br />
            <span>en un solo lugar</span>
          </h1>
          <p className="hero-banner__subtitle">
            Electrónica, ropa, hogar y más — con envíos a todo el Paraguay
          </p>
          <div className="hero-banner__actions">
            <Link to="/productos" className="btn-hero-primary">
              <ShoppingBag size={16} /> Ver catálogo
            </Link>
            <Link to="/buscar" className="btn-hero-ghost">
              <Tag size={16} /> Buscar productos
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}

// ── Categorías ───────────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  'Electrónica': '💻',
  'Ropa': '👕',
  'Hogar': '🏠',
  'Deporte': '⚽',
  'Belleza': '💄',
  'Juguetes': '🧸',
  'Libros': '📚',
  'Alimentos': '🍎',
};

function CategorySection() {
  const { data: categories } = useCategories();
  const topLevel = categories?.filter((c) => !c.parentId).slice(0, 5) ?? [];

  if (!topLevel.length) return null;

  return (
    <section className="py-4 bg-light">
      <Container fluid="xl">
        <SectionTitle title="Categorías" />
        <div className="category-grid">
          {topLevel.map((cat) => (
            <Link key={cat.id} to={`/productos?categoria=${cat.slug}`} className="category-card">
              <div className="category-card__icon">
                <span>{CATEGORY_ICONS[cat.name] ?? '📦'}</span>
              </div>
              <span className="category-card__name">{cat.name}</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ── Promo Banner ─────────────────────────────────────────────────────────────
function PromoBanner() {
  return (
    <div className="promo-banner">
      <Container fluid="xl" className="position-relative" style={{ zIndex: 1 }}>
        <p className="promo-banner__eyebrow">Oferta limitada</p>
        <p className="promo-banner__title">Usá el cupón BIENVENIDO10</p>
        <p className="promo-banner__subtitle">
          10% de descuento en tu primera compra — mínimo ₲ 50.000
        </p>
        <Link to="/productos" className="promo-banner__cta">
          Ver productos →
        </Link>
      </Container>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export function HomePage() {
  return (
    <>
      <AppNavbar />
      <main className="page-content">
        <HeroBanner />
        <CategorySection />

        <section className="py-5">
          <Container fluid="xl">
            <SectionTitle title="Productos Destacados" linkText="Ver todos" linkTo="/productos" />
            <ProductGrid limit={8} />
          </Container>
        </section>

        <PromoBanner />

        <section className="py-5 bg-light">
          <Container fluid="xl">
            <SectionTitle title="Más productos" linkText="Ver catálogo completo" linkTo="/productos" />
            <ProductGrid filters={{ page: 1, limit: 12 }} limit={4} />
          </Container>
        </section>
      </main>
      <BottomNav />
    </>
  );
}

