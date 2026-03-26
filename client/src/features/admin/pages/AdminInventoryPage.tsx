import { useState } from 'react';
import { Form, Modal, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { AlertTriangle, RefreshCw, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminInventory, useUpdateStock } from '..';
import { formatPrice } from '../../../shared/utils/formatPrice';
import { useVirtualList } from '../../../shared/hooks/useVirtualList';
import type { AdminInventoryVariant } from '..';

// ── Límite de items por página para scroll virtual
const VIRTUAL_PAGE_SIZE = 100;

// ── Modal de edición de stock ─────────────────────────────────────────────────

interface EditStockModalProps {
  variant: AdminInventoryVariant | null;
  onHide: () => void;
}

function EditStockModal({ variant, onHide }: EditStockModalProps) {
  const [stock, setStock] = useState(variant?.stock ?? 0);
  const [error, setError] = useState<string | null>(null);
  const mutation = useUpdateStock();

  if (!variant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (stock < 0) { setError('El stock no puede ser negativo.'); return; }
    try {
      await mutation.mutateAsync({ variantId: variant.id, stock });
      onHide();
    } catch {
      setError('No se pudo actualizar el stock.');
    }
  };

  return (
    <Modal show onHide={onHide} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 fw-bold">Editar stock</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <div className="fw-semibold text-dark small">{variant.product.name}</div>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>SKU: {variant.sku}</div>
        </div>
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium small">Stock actual: <strong>{variant.stock}</strong></Form.Label>
            <Form.Control
              type="number"
              size="sm"
              min={0}
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              required
              autoFocus
            />
          </Form.Group>
          <div className="d-flex gap-2 justify-content-end">
            <Button variant="outline-secondary" size="sm" type="button" onClick={onHide}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <><Spinner size="sm" className="me-1" />Guardando…</> : 'Guardar'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

// ── Stock bar ─────────────────────────────────────────────────────────────────

function StockBar({ stock }: { stock: number }) {
  const max = 100;
  const pct = Math.min((stock / max) * 100, 100);
  const color = stock === 0 ? 'danger' : stock <= 5 ? 'warning' : stock <= 20 ? 'info' : 'success';
  return (
    <div style={{ minWidth: 80 }}>
      <div className="progress" style={{ height: 5, borderRadius: 99 }}>
        <div
          className={`progress-bar bg-${color}`}
          style={{ width: `${pct}%`, borderRadius: 99 }}
        />
      </div>
      <div className="d-flex justify-content-between mt-1" style={{ fontSize: '0.7rem' }}>
        <span className={`text-${color} fw-semibold`}>{stock}</span>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function AdminInventoryPage() {
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminInventoryVariant | null>(null);
  const { data, isLoading, isError, refetch } = useAdminInventory(lowStock, page, VIRTUAL_PAGE_SIZE);

  const items = data?.items ?? [];
  const lowStockCount = data?.lowStockCount ?? 0;

  const { containerRef, virtualItems, totalSize, measureElement } = useVirtualList({
    count: items.length,
    estimateSize: 58,
    overscan: 8,
  });

  return (
    <div>
      <div className="admin-page-header d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div>
          <h1>Inventario</h1>
          <p>Control de stock por variante de producto</p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
          onClick={() => refetch()}
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* Barra de herramientas */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2 px-3 d-flex align-items-center gap-3 flex-wrap">
          <Form.Check
            type="switch"
            id="low-stock-switch"
            label={
              <span className="small fw-medium">
                Solo stock bajo
                {lowStockCount > 0 && (
                  <Badge bg="warning" text="dark" className="ms-2" style={{ fontSize: '0.7rem' }}>
                    <AlertTriangle size={10} className="me-1" />
                    {lowStockCount}
                  </Badge>
                )}
              </span>
            }
            checked={lowStock}
            onChange={(e) => { setLowStock(e.target.checked); setPage(1); }}
          />
          {data && (
            <span className="small text-muted ms-auto">
              {data.total} variante{data.total !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Tabla con scroll virtual */}
      <div className="card border-0 shadow-sm">
        {/* Contenedor scroll — altura fija para activar la virtualización */}
        <div
          ref={containerRef}
          style={{ height: 520, overflowY: 'auto' }}
        >
          <table className="table table-hover align-middle mb-0 small" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: '35%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '12%' }} />
            </colgroup>
            <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th className="ps-3">Producto</th>
                <th>SKU</th>
                <th style={{ minWidth: 120 }}>Stock</th>
                <th className="text-end">Precio</th>
                <th className="pe-3"></th>
              </tr>
            </thead>
            <tbody style={{ position: 'relative', height: isLoading || items.length === 0 ? undefined : totalSize }}>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="text-center py-5">
                    <Spinner animation="border" variant="primary" size="sm" />
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-danger">
                    Error al cargar el inventario.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    {lowStock ? 'No hay variantes con stock bajo.' : 'No hay variantes registradas.'}
                  </td>
                </tr>
              )}
              {virtualItems.map((vRow) => {
                const variant = items[vRow.index];
                if (!variant) return null;
                return (
                  <tr
                    key={variant.id}
                    ref={measureElement}
                    data-index={vRow.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${vRow.start}px)`,
                    }}
                  >
                    <td className="ps-3" style={{ width: '35%' }}>
                      <div className="fw-medium text-dark">{variant.product.name}</div>
                      {Object.entries(variant.attributes ?? {}).map(([k, v]) => (
                        <Badge key={k} bg="light" text="secondary" className="me-1 fw-normal" style={{ fontSize: '0.68rem' }}>
                          {k}: {String(v)}
                        </Badge>
                      ))}
                    </td>
                    <td style={{ width: '20%' }}>
                      <span className="font-monospace text-muted">{variant.sku}</span>
                    </td>
                    <td style={{ width: '20%' }}>
                      <StockBar stock={variant.stock} />
                    </td>
                    <td className="text-end" style={{ width: '13%' }}>{formatPrice(variant.price)}</td>
                    <td className="pe-3" style={{ width: '12%' }}>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setEditing(variant)}
                      >
                        <Edit2 size={12} /> Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {data && data.totalPages > 1 && (
          <div className="card-footer bg-transparent border-top d-flex align-items-center justify-content-between px-3 py-2">
            <span className="small text-muted">
              Página {data.page} de {data.totalPages} · {data.total} variantes
            </span>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft size={14} />
              </Button>
              <Button variant="outline-secondary" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <EditStockModal variant={editing} onHide={() => setEditing(null)} />
      )}
    </div>
  );
}
