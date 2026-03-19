import { Container } from 'react-bootstrap';
import { AppNavbar } from '../shared/components/AppNavbar';
import { BottomNav } from '../shared/components/BottomNav';
import { AppFooter } from '../shared/components/AppFooter';
import { SectionTitle } from '../shared/components/SectionTitle';
import { ProductSwiper } from '../features/catalog/components/ProductSwiper';
import { FeaturedCategorySpotlight } from '../features/catalog/components/FeaturedCategorySpotlight';
import { HeroBannerSlider } from '../features/banners/components/HeroBannerSlider';
import { PopularCategoriesSection } from '../features/catalog/components/PopularCategoriesSection';

// ── Página principal ─────────────────────────────────────────────────────────
export function HomePage() {
  return (
    <>
      <AppNavbar />
      <main className="page-content">
        <HeroBannerSlider />
        <PopularCategoriesSection />

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

        <HeroBannerSlider type="PROMO_STRIP" />

        <HeroBannerSlider type="PROMO_FOOTER" />
      </main>
      <AppFooter />
      <BottomNav />
    </>
  );
}

