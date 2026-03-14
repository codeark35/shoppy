import { ProductCard } from './ProductCard';
import type { ProductFilters } from '../types/catalog.types';
import { useProducts } from '../hooks/useProducts';

interface ProductGridProps {
  filters?: ProductFilters;
  limit?: number;
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

export function ProductGrid({ filters = {}, limit }: ProductGridProps) {
  const { data, isLoading, isError } = useProducts(filters);
  const products = limit ? data?.data.slice(0, limit) : data?.data;
  const skeletonCount = limit ?? 8;

  if (isLoading) {
    return (
      <div className="products-grid">
        {Array.from({ length: skeletonCount }).map((_, i) => (
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
    <div className="products-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
