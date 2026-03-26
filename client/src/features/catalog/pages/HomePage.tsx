import { Container } from 'react-bootstrap';
import { AppNavbar } from '../../../shared/components/AppNavbar';
import { BottomNav } from '../../../shared/components/BottomNav';
import { AppFooter } from '../../../shared/components/AppFooter';
import { SectionTitle } from '../../../shared/components/SectionTitle';
import { ProductSwiper } from '../components/ProductSwiper';
import { FeaturedCategorySpotlight } from '../components/FeaturedCategorySpotlight';
import { HeroBannerSlider } from '../../banners/components/HeroBannerSlider';
import { PopularCategoriesSection } from '../components/PopularCategoriesSection';

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
            <SectionTitle title="Productos en ofertas" linkText="Ver todos" linkTo="/productos" />
            <ProductSwiper filters={{ onSale: true }} limit={20} autoplay />
          </Container>
        </section>

        <section className="py-5">
          <Container fluid="xl">
            <SectionTitle title="Productos Destacados" linkText="Ver todos" linkTo="/productos" />
            <ProductSwiper filters={{ featured: true }} limit={10} autoplay />
          </Container>
        </section>

        <HeroBannerSlider type="PROMO" />

        <FeaturedCategorySpotlight />

        <HeroBannerSlider type="PROMO_STRIP" />

        <section className="py-5">
          <Container fluid="xl">
            <SectionTitle title="Productos Recientes" linkText="Ver todos" linkTo="/productos" />
            <ProductSwiper filters={{ sortBy: 'newest' }} limit={20} autoplay />
          </Container>
        </section>

        <HeroBannerSlider type="PROMO_FOOTER" />
      </main>
      <AppFooter />
      <BottomNav />
    </>
  );
}
