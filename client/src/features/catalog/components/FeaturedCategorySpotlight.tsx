import { Link } from "react-router-dom";
import { Container } from "react-bootstrap";
import { ArrowRight } from "lucide-react";
import { useFeaturedCategories } from "../hooks/useProducts";
import { ProductSwiper } from "./ProductSwiper";
import type { Category } from "../types/catalog.types";
import { SectionTitle } from "../../../shared/components/SectionTitle";

// ── Placeholder cuando no hay imagen ─────────────────────────────────────────

function CategoryPlaceholder({ name }: { name: string }) {
  return (
    <div className="featured-spotlight__placeholder">
      <span className="featured-spotlight__placeholder-text">{name}</span>
    </div>
  );
}

// ── Bloque por categoría ──────────────────────────────────────────────────────

function SpotlightBlock({ category }: { category: Category }) {
  return (
    <section className="py-5 bg-light">
      <Container fluid="xl">
        {/* Encabezado de sección */}

        <SectionTitle
          title={category.name}
          linkText="Ver mas"
          linkTo={`/productos?categoria=${category.slug}`}
        />

        {/* Layout: imagen categoria izq + swiper der */}
        <div className="featured-spotlight__layout">
          {/* Tarjeta categoría */}
          <Link
            to={`/productos?categoria=${category.slug}`}
            className="featured-spotlight__card"
          >
            {category.imageUrl ? (
              <img
                src={category.imageUrl}
                alt={category.name}
                className="featured-spotlight__card-img"
              />
            ) : (
              <CategoryPlaceholder name={category.name} />
            )}
            <div className="featured-spotlight__card-label">
              {category.name}
            </div>
          </Link>

          {/* Swiper productos */}
          <div className="featured-spotlight__swiper">
            <ProductSwiper
              filters={{ categorySlug: category.slug }}
              limit={8}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function FeaturedCategorySpotlight() {
  const { data: categories, isLoading } = useFeaturedCategories();

  if (isLoading || !categories?.length) return null;

  return (
    <>
      {categories.map((cat) => (
        <SpotlightBlock key={cat.id} category={cat} />
      ))}
    </>
  );
}
