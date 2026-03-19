import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, FreeMode } from 'swiper/modules';
import { SectionTitle } from '../../../shared/components/SectionTitle';
import { usePopularCategories } from '../hooks/useProducts';
import { useCategories } from '../hooks/useProducts';
import { analyticsTracker } from '../../analytics/services/analytics.tracker';
import type { AnalyticsTopCategory } from '../../analytics/types/analytics.types';
import type { Category } from '../types/catalog.types';

// Enriquece los top-cats con imageUrl de la lista completa de categorías
function useMergedPopularCategories(limit = 10) {
  const popular = usePopularCategories(limit);
  const all = useCategories();

  if (!popular.data) return { ...popular, data: undefined };

  const map = new Map<string, Category>(
    (all.data ?? []).map((c) => [c.id, c]),
  );

  const merged = popular.data
    .map((pc: AnalyticsTopCategory) => ({
      ...pc,
      imageUrl: map.get(pc.id)?.imageUrl,
      slug: pc.slug,
    }))
    .filter((c) => c.slug);

  return { ...popular, data: merged };
}

export function PopularCategoriesSection({ limit = 10 }: { limit?: number }) {
  const { data, isLoading } = useMergedPopularCategories(limit);

  // No renderizar si no hay datos (primeras visitas / DB vacía)
  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section className="popular-cats">
      <Container fluid="xl">
        <SectionTitle title="Categorías más buscadas" />

        <Swiper
          modules={[Navigation, Pagination, FreeMode]}
          spaceBetween={12}
          slidesPerView="auto"
          freeMode
          navigation
          pagination={{ clickable: true, dynamicBullets: true }}
          className="popular-cats__swiper"
          breakpoints={{
            0:   { slidesPerView: 3, spaceBetween: 6 },
            576: { slidesPerView: 4, spaceBetween: 8 },
            768: { slidesPerView: 5, spaceBetween: 10 },
            992: { slidesPerView: 7, spaceBetween: 10 },
            1200:{ slidesPerView: 8, spaceBetween: 10 },
          }}
        >
          {isLoading
            ? Array.from({ length: 7 }).map((_, i) => (
                <SwiperSlide key={i} className="popular-cats__slide">
                  <div className="popular-cats__card popular-cats__card--skeleton">
                    <div className="popular-cats__img-wrap" />
                    <div className="popular-cats__name popular-cats__name--skeleton" />
                  </div>
                </SwiperSlide>
              ))
            : data!.map((cat) => (
                <SwiperSlide key={cat.id} className="popular-cats__slide">
                  <Link
                    to={`/productos?categoria=${cat.slug}`}
                    className="popular-cats__card"
                    onClick={() => analyticsTracker.trackCategoryView(cat.id)}
                  >
                    <div className="popular-cats__img-wrap">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={cat.name} loading="lazy" />
                      ) : (
                        <span className="popular-cats__emoji">📦</span>
                      )}
                    </div>
                    <span className="popular-cats__name">{cat.name}</span>
                  </Link>
                </SwiperSlide>
              ))}
        </Swiper>
      </Container>
    </section>
  );
}
