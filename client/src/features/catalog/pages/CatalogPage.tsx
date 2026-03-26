import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, InputGroup, Button } from 'react-bootstrap';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { AppNavbar } from '../../../shared/components/AppNavbar';
import { BottomNav } from '../../../shared/components/BottomNav';
import { AppFooter } from '../../../shared/components/AppFooter';
import { ProductGrid } from '../components/ProductGrid';
import { FilterSidebar } from '../components/FilterSidebar';
import { CategoryNav } from '../components/CategoryNav';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useCategories } from '../hooks/useProducts';
import { analyticsTracker } from '../../analytics/services/analytics.tracker';
import type { ProductFilters } from '../types/catalog.types';

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>(() => {
    const categoria = searchParams.get('categoria');
    return categoria ? { categorySlug: categoria } : {};
  });
  const debouncedSearch = useDebounce(search, 400);
  const { data: allCategories = [] } = useCategories();

  // Sync URL → filtro cuando cambia el parámetro ?categoria= (ej. navegación interna)
  useEffect(() => {
    const categoria = searchParams.get('categoria');
    setFilters((prev) => {
      if ((categoria ?? undefined) === prev.categorySlug) return prev;
      return { ...prev, categorySlug: categoria ?? undefined };
    });
  }, [searchParams]);

  // Sync filtro → URL para que la barra de direcciones refleje la categoría activa
  const handleFiltersChange = (next: ProductFilters) => {
    setFilters(next);
    if (next.categorySlug) {
      setSearchParams({ categoria: next.categorySlug }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  // Trackear visita a categoría cuando cambia el filtro activo
  useEffect(() => {
    if (!filters.categorySlug) return;
    const flat = allCategories.flatMap((c) => [c, ...(c.children ?? [])]);
    const cat = flat.find((c) => c.slug === filters.categorySlug);
    if (cat?.id) analyticsTracker.trackCategoryView(cat.id);
  }, [filters.categorySlug]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (debouncedSearch.trim()) analyticsTracker.trackSearch(debouncedSearch.trim());
  }, [debouncedSearch]);

  const activeFilters: ProductFilters = {
    ...filters,
    ...(debouncedSearch && { search: debouncedSearch }),
  };

  const activeCount =
    (filters.categorySlug ? 1 : 0) +
    (filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0) +
    (filters.onSale ? 1 : 0);

  return (
    <>
      <AppNavbar />
      <Container fluid="xl" className="py-4 pb-5 mb-4">
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
            onSelect={(partial) => handleFiltersChange({ ...filters, ...partial })}
          />
        </div>

        <ProductGrid filters={activeFilters} />
      </Container>

      <FilterSidebar
        show={showFilters}
        onHide={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <AppFooter />
      <BottomNav />
    </>
  );
}
