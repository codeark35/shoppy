import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade, A11y } from 'swiper/modules';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { useBanners } from '../hooks/useBanners';
import type { Banner } from '../types/banner.types';

// ── Slide individual ──────────────────────────────────────────────────────────

function BannerSlide({ banner }: { banner: Banner }) {
  return (
    <div
      className="hero-slide"
      style={{
        backgroundImage: banner.imageUrl ? `url(${banner.imageUrl})` : undefined,
      }}
    >
      {banner.buttonText && banner.buttonLink && (
        <div className="hero-slide__overlay" />
      )}

      {banner.buttonText && banner.buttonLink && (
        <Container fluid="xl" className="position-relative" style={{ zIndex: 2 }}>
          <div className="hero-slide__content">
            <Link to={banner.buttonLink} className="btn-hero-primary">
              <ShoppingBag size={16} /> {banner.buttonText}
            </Link>
          </div>
        </Container>
      )}
    </div>
  );
}

// ── Slide skeleton cargando ───────────────────────────────────────────────────

function HeroSkeleton() {
  return (
    <div className="hero-slide hero-slide--skeleton">
      <Container fluid="xl" className="position-relative" style={{ zIndex: 2 }}>
        <div className="hero-slide__content">
          <div className="hero-skeleton__title" />
          <div className="hero-skeleton__subtitle" />
          <div className="hero-skeleton__btn" />
        </div>
      </Container>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

import type { BannerType } from '../types/banner.types';

export function HeroBannerSlider({ type = 'HERO' }: { type?: BannerType }) {
  const { data: banners, isLoading } = useBanners(type);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  if (isLoading) return <HeroSkeleton />;

  // Si no hay banners activos, no renderizar nada (la sección queda vacía)
  if (!banners?.length) return null;

  // Un único banner: sin controles de navegación
  const single = banners.length === 1;

  return (
    <div className="hero-slider-wrapper">
      {!single && (
        <>
          <button ref={prevRef} className="hero-nav hero-nav--prev" aria-label="Anterior">
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <button ref={nextRef} className="hero-nav hero-nav--next" aria-label="Siguiente">
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </>
      )}

      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade, A11y]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        navigation={single ? false : { prevEl: prevRef.current, nextEl: nextRef.current }}
        onBeforeInit={(swiper) => {
          if (!single && typeof swiper.params.navigation === 'object' && swiper.params.navigation) {
            const nav = swiper.params.navigation as { prevEl: HTMLElement | null; nextEl: HTMLElement | null };
            nav.prevEl = prevRef.current;
            nav.nextEl = nextRef.current;
          }
        }}
        pagination={single ? false : { clickable: true, dynamicBullets: true }}
        autoplay={single ? false : { delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        loop={!single}
        speed={700}
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <BannerSlide banner={banner} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
