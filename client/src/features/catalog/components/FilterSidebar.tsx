import { Offcanvas, Form, Button, Badge, Spinner } from 'react-bootstrap';
import { useCategories } from '../hooks/useProducts';
import type { ProductFilters } from '../types/catalog.types';

interface Props {
  show: boolean;
  onHide: () => void;
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
}

const PRICE_RANGES = [
  { label: 'Todos los precios', min: undefined, max: undefined },
  { label: 'Hasta ₲ 50.000', min: undefined, max: 50000 },
  { label: '₲ 50.000 – 150.000', min: 50000, max: 150000 },
  { label: '₲ 150.000 – 500.000', min: 150000, max: 500000 },
  { label: 'Más de ₲ 500.000', min: 500000, max: undefined },
];

export function FilterSidebar({ show, onHide, filters, onFiltersChange }: Props) {
  const { data: categories, isLoading } = useCategories();

  const setCategory = (slug: string | undefined) => {
    onFiltersChange({ ...filters, categorySlug: slug, page: 1 });
  };

  const setPriceRange = (min?: number, max?: number) => {
    onFiltersChange({ ...filters, minPrice: min, maxPrice: max, page: 1 });
  };

  const clearAll = () => {
    onFiltersChange({ search: filters.search, page: 1 });
    onHide();
  };

  const activeFiltersCount =
    (filters.categorySlug ? 1 : 0) +
    (filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0) +
    (filters.onSale ? 1 : 0);

  return (
    <Offcanvas show={show} onHide={onHide} placement="start">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title className="fw-bold">
          Filtros{' '}
          {activeFiltersCount > 0 && (
            <Badge bg="primary" pill className="ms-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        {/* Categorías */}
        <div className="mb-4">
          <p className="fw-semibold mb-2 text-uppercase small text-muted">Categoría</p>
          {isLoading ? (
            <Spinner size="sm" />
          ) : (
            <div className="d-flex flex-column gap-1">
              <Form.Check
                type="radio"
                id="cat-all"
                label="Todas las categorías"
                checked={!filters.categorySlug}
                onChange={() => setCategory(undefined)}
              />
              {categories?.map((cat) => (
                <div key={cat.id}>
                  <Form.Check
                    type="radio"
                    id={`cat-${cat.id}`}
                    label={cat.name}
                    checked={filters.categorySlug === cat.slug}
                    onChange={() => setCategory(cat.slug)}
                  />
                  {cat.children?.map((child) => (
                    <Form.Check
                      key={child.id}
                      type="radio"
                      id={`cat-${child.id}`}
                      label={child.name}
                      className="ms-3"
                      checked={filters.categorySlug === child.slug}
                      onChange={() => setCategory(child.slug)}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* En oferta */}
        <div className="mb-4">
          <p className="fw-semibold mb-2 text-uppercase small text-muted">Ofertas</p>
          <Form.Check
            type="switch"
            id="filter-on-sale"
            label={<span>Solo productos en oferta <span className="badge rounded-pill ms-1" style={{ background: '#16A34A', fontSize: '0.6rem' }}>OFERTA</span></span>}
            checked={!!filters.onSale}
            onChange={(e) => onFiltersChange({ ...filters, onSale: e.target.checked || undefined, page: 1 })}
          />
        </div>

        {/* Rango de precio */}
        <div className="mb-4">
          <p className="fw-semibold mb-2 text-uppercase small text-muted">Precio</p>
          <div className="d-flex flex-column gap-1">
            {PRICE_RANGES.map((range) => (
              <Form.Check
                key={range.label}
                type="radio"
                id={`price-${range.label}`}
                label={range.label}
                checked={
                  filters.minPrice === range.min && filters.maxPrice === range.max
                }
                onChange={() => setPriceRange(range.min, range.max)}
              />
            ))}
          </div>
        </div>

        <div className="d-flex gap-2 mt-4">
          <Button variant="primary" className="flex-fill" onClick={onHide}>
            Ver resultados
          </Button>
          {activeFiltersCount > 0 && (
            <Button variant="outline-secondary" onClick={clearAll}>
              Limpiar
            </Button>
          )}
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
}
