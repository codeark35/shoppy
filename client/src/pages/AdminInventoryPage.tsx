import { useState } from 'react';
import { Form, Modal, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { AlertTriangle, RefreshCw, Edit2 } from 'lucide-react';
import { useAdminInventory, useUpdateStock } from '../features/admin';
import { formatPrice } from '../shared/utils/formatPrice';
import type { AdminInventoryVariant } from '../features/admin';

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
  const [editing, setEditing] = useState<AdminInventoryVariant | null>(null);
  const { data, isLoading, isError, refetch } = useAdminInventory(lowStock);

  const lowStockCount = data?.filter((v) => v.stock <= 5).length ?? 0;

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
            onChange={(e) => setLowStock(e.target.checked)}
          />
          {data && (
            <span className="small text-muted ms-auto">
              {data.length} variante{data.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr>
                <th className="ps-3">Producto</th>
                <th>SKU</th>
                <th style={{ minWidth: 120 }}>Stock</th>
                <th className="text-end">Precio</th>
                <th className="pe-3"></th>
              </tr>
            </thead>
            <tbody>
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
              {data?.map((variant) => (
                <tr key={variant.id}>
                  <td className="ps-3">
                    <div className="fw-medium text-dark">{variant.product.name}</div>
                    {Object.entries(variant.attributes ?? {}).map(([k, v]) => (
                      <Badge key={k} bg="light" text="secondary" className="me-1 fw-normal" style={{ fontSize: '0.68rem' }}>
                        {k}: {String(v)}
                      </Badge>
                    ))}
                  </td>
                  <td>
                    <span className="font-monospace text-muted">{variant.sku}</span>
                  </td>
                  <td>
                    <StockBar stock={variant.stock} />
                  </td>
                  <td className="text-end">{formatPrice(variant.price)}</td>
                  <td className="pe-3">
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
              ))}
              {!isLoading && !isError && data?.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    {lowStock ? 'No hay variantes con stock bajo.' : 'No hay variantes registradas.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <EditStockModal variant={editing} onHide={() => setEditing(null)} />
      )}
    </div>
  );
}
