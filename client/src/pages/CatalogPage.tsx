import { useState } from 'react';
import { Container, Row, Col, Form, InputGroup, Button } from 'react-bootstrap';
import { Search, SlidersHorizontal } from 'lucide-react';
import { AppNavbar } from '../shared/components/AppNavbar';
import { BottomNav } from '../shared/components/BottomNav';
import { ProductGrid } from '../features/catalog/components/ProductGrid';
import { FilterSidebar } from '../features/catalog/components/FilterSidebar';
import { CategoryNav } from '../features/catalog/components/CategoryNav';
import { useDebounce } from '../shared/hooks/useDebounce';
import type { ProductFilters } from '../features/catalog/types/catalog.types';

export function CatalogPage() {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({});
  const debouncedSearch = useDebounce(search, 400);

  const activeFilters: ProductFilters = {
    ...filters,
    ...(debouncedSearch && { search: debouncedSearch }),
  };

  const activeCount =
    (filters.categorySlug ? 1 : 0) +
    (filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0);

  return (
    <>
      <AppNavbar />
      <Container className="py-4 pb-5 mb-4">
        {/* Barra de búsqueda + botón filtros */}
        <Row className="mb-3 align-items-center g-2">
          <Col>
            <InputGroup>
              <InputGroup.Text><Search size={16} /></InputGroup.Text>
              <Form.Control
                placeholder="Buscar productos…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
          </Col>
          <Col xs="auto">
            <Button
              variant={activeCount > 0 ? 'primary' : 'outline-secondary'}
              onClick={() => setShowFilters(true)}
              className="d-flex align-items-center gap-2"
            >
              <SlidersHorizontal size={16} />
              <span className="d-none d-sm-inline">Filtros</span>
              {activeCount > 0 && <span>({activeCount})</span>}
            </Button>
          </Col>
        </Row>

        {/* Pills de categorías (scroll horizontal) */}
        <div className="mb-4">
          <CategoryNav
            activeSlug={filters.categorySlug}
            onSelect={(partial) => setFilters((prev) => ({ ...prev, ...partial }))}
          />
        </div>

        <ProductGrid filters={activeFilters} />
      </Container>

      <FilterSidebar
        show={showFilters}
        onHide={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <BottomNav />
    </>
  );
}
