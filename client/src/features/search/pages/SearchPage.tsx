import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Col, Row, Spinner, Form } from 'react-bootstrap';
import { useSearch } from '..';
import { ProductCard } from '../../catalog';
import type { SearchFilters } from '..';

const PRICE_OPTIONS = [
  { label: 'Cualquier precio', min: undefined, max: undefined },
  { label: 'Hasta ₲50.000', min: undefined, max: 50000 },
  { label: '₲50.000 – ₲200.000', min: 50000, max: 200000 },
  { label: '₲200.000 – ₲500.000', min: 200000, max: 500000 },
  { label: 'Más de ₲500.000', min: 500000, max: undefined },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') ?? '';
  const pageParam = Number(searchParams.get('page') ?? 1);

  const [priceIdx, setPriceIdx] = useState(0);
  const selectedPrice = PRICE_OPTIONS[priceIdx];

  const filters: SearchFilters = {
    q: queryParam,
    minPrice: selectedPrice.min,
    maxPrice: selectedPrice.max,
    page: pageParam,
    limit: 24,
  };

  const { data, isLoading, isFetching } = useSearch(filters, queryParam.length > 1);

  // Resetear página al cambiar filtros
  useEffect(() => {
    if (pageParam !== 1) {
      setSearchParams((prev) => {
        prev.set('page', '1');
        return prev;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceIdx]);

  const setPage = (p: number) =>
    setSearchParams((prev) => {
      prev.set('page', String(p));
      return prev;
    });

  const products = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="h5 fw-bold mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
          {queryParam
            ? <>Resultados para: <span className="text-primary">"{queryParam}"</span></>
            : 'Búsqueda'}
        </h1>
        {meta && (
          <p className="text-muted small mb-0">
            {meta.total} {meta.total === 1 ? 'producto encontrado' : 'productos encontrados'}
            {isFetching && !isLoading && (
              <span className="ms-2 text-muted">
                <Spinner size="sm" animation="border" className="me-1" />
                Actualizando…
              </span>
            )}
          </p>
        )}
      </div>

      <Row className="g-4">
        {/* Filtros lateral */}
        <Col xs={12} md={3} lg={2}>
          <div className="card border-0 shadow-sm p-3">
            <h6 className="fw-semibold mb-3 small text-uppercase text-muted">Precio</h6>
            {PRICE_OPTIONS.map((opt, idx) => (
              <Form.Check
                key={idx}
                type="radio"
                id={`price-${idx}`}
                label={opt.label}
                checked={priceIdx === idx}
                onChange={() => setPriceIdx(idx)}
                className="mb-2 small"
              />
            ))}
          </div>
        </Col>

        {/* Grid de resultados */}
        <Col xs={12} md={9} lg={10}>
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: '3rem' }}>🔍</div>
              <h5 className="mt-3 fw-semibold">Sin resultados</h5>
              <p className="text-muted">
                No encontramos productos que coincidan con "{queryParam}".
              </p>
            </div>
          ) : (
            <>
              <Row xs={2} sm={3} lg={4} xl={5} className="g-3">
                {products.map((product) => (
                  <Col key={product.id}>
                    <ProductCard product={product} />
                  </Col>
                ))}
              </Row>

              {/* Paginación */}
              {meta && meta.totalPages > 1 && (
                <nav className="mt-4 d-flex justify-content-center">
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${meta.page <= 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage(meta.page - 1)}>
                        ‹
                      </button>
                    </li>
                    {[...Array(meta.totalPages)].map((_, i) => (
                      <li
                        key={i + 1}
                        className={`page-item ${meta.page === i + 1 ? 'active' : ''}`}
                      >
                        <button className="page-link" onClick={() => setPage(i + 1)}>
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${meta.page >= meta.totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage(meta.page + 1)}>
                        ›
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </Col>
      </Row>
    </div>
  );
}
