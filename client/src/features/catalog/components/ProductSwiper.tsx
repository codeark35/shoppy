import { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { ProductCard } from './ProductCard';
import type { ProductFilters } from '../types/catalog.types';
import { useProducts } from '../hooks/useProducts';

interface ProductSwiperProps {
  filters?: ProductFilters;
  limit?: number;
  autoplay?: boolean;
}

function ProductSkeleton() {
  return (
    <div className="product-card-skeleton">
      <div className="img-skeleton" />
      <div className="body-skeleton">
        <div className="line line-sm" />
        <div className="line" />
        <div className="line-price" />
        <div className="btn-skeleton" />
      </div>
    </div>
  );
}

export function ProductSwiper({ filters = {}, limit, autoplay = false }: ProductSwiperProps) {
  const { data, isLoading, isError } = useProducts(filters);
  const products = limit ? data?.data.slice(0, limit) : data?.data;
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  if (isLoading) {
    return (
      <div className="products-grid">
        {Array.from({ length: limit ?? 4 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return <div className="alert alert-danger">Error al cargar productos. Intentá de nuevo.</div>;
  }

  if (!products?.length) {
    return (
      <div className="text-center py-5 text-muted">
        <p>No se encontraron productos.</p>
      </div>
    );
  }

  return (
    <div className="product-swiper-wrapper">
      {/* Botones custom de navegación */}
      <button ref={prevRef} className="ps-nav ps-nav--prev" aria-label="Anterior">
        <ChevronLeft size={18} strokeWidth={2.5} />
      </button>
      <button ref={nextRef} className="ps-nav ps-nav--next" aria-label="Siguiente">
        <ChevronRight size={18} strokeWidth={2.5} />
      </button>

      <Swiper
        modules={[Navigation, Pagination, A11y, ...(autoplay ? [Autoplay] : [])]}
        navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
        onBeforeInit={(swiper) => {
          if (typeof swiper.params.navigation === 'object' && swiper.params.navigation) {
            (swiper.params.navigation as { prevEl: HTMLButtonElement | null; nextEl: HTMLButtonElement | null }).prevEl = prevRef.current;
            (swiper.params.navigation as { prevEl: HTMLButtonElement | null; nextEl: HTMLButtonElement | null }).nextEl = nextRef.current;
          }
        }}
        pagination={{ clickable: true }}
        spaceBetween={16}
        slidesPerView={1.2}
        centeredSlides={false}
        autoplay={autoplay ? { delay: 3500, disableOnInteraction: true } : false}
        breakpoints={{
          480: { slidesPerView: 2, spaceBetween: 16 },
          768: { slidesPerView: 3, spaceBetween: 20 },
          1024: { slidesPerView: 4, spaceBetween: 24 },
          1280: { slidesPerView: 5, spaceBetween: 24 },
        }}
      >
        {products.map((product) => (
          <SwiperSlide key={product.id}>
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
