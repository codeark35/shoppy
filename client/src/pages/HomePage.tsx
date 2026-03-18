import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { AppNavbar } from '../shared/components/AppNavbar';
import { BottomNav } from '../shared/components/BottomNav';
import { AppFooter } from '../shared/components/AppFooter';
import { SectionTitle } from '../shared/components/SectionTitle';
import { ProductSwiper } from '../features/catalog/components/ProductSwiper';
import { FeaturedCategorySpotlight } from '../features/catalog/components/FeaturedCategorySpotlight';
import { useCategories } from '../features/catalog/hooks/useProducts';
import { HeroBannerSlider } from '../features/banners/components/HeroBannerSlider';

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

// ── Página principal ─────────────────────────────────────────────────────────
export function HomePage() {
  return (
    <>
      <AppNavbar />
      <main className="page-content">
        <HeroBannerSlider />
        <CategorySection />

        <section className="py-5">
          <Container fluid="xl">
            <SectionTitle title="Productos Destacados" linkText="Ver todos" linkTo="/productos" />
            <ProductSwiper filters={{ featured: true }} limit={10} autoplay />
          </Container>
        </section>

        <HeroBannerSlider type="PROMO" />

        <section className="py-5">
          <Container fluid="xl">
            <SectionTitle title="Productos en ofertas" linkText="Ver todos" linkTo="/productos" />
            <ProductSwiper filters={{ onSale: true }} limit={20} autoplay />
          </Container>
        </section>


        {/* <section className="py-5 bg-light">
          <Container fluid="xl">
            <SectionTitle title="Nuevos productos" linkText="Ver catálogo completo" linkTo="/productos" />
            <ProductSwiper filters={{ page: 2, limit: 12  }} limit={10} />
          </Container>
        </section> */}

        <FeaturedCategorySpotlight />
      </main>
      <AppFooter />
      <BottomNav />
    </>
  );
}

