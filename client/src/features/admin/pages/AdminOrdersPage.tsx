import { useState } from 'react';
import { Badge, Form, Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminOrders, useUpdateOrderStatus } from '..';
import { formatPrice } from '../../../shared/utils/formatPrice';
import { ORDER_STATUS_LABELS, ORDER_STATUS_VARIANT } from '../../orders/types/orders.types';
import type { OrderStatus } from '../../orders/types/orders.types';
import type { AdminOrder } from '..';

// ── Constantes ────────────────────────────────────────────────────────────────

const ALL_STATUSES: OrderStatus[] = [
  'PENDING', 'PAYMENT_PROCESSING', 'PAID', 'PREPARING',
  'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED',
];

// ── Modal de actualización de estado ─────────────────────────────────────────

interface UpdateStatusModalProps {
  order: AdminOrder | null;
  onHide: () => void;
}

function UpdateStatusModal({ order, onHide }: UpdateStatusModalProps) {
  const [status, setStatus] = useState<OrderStatus>(order?.status ?? 'PENDING');
  const [trackingNumber, setTrackingNumber] = useState(order?.shipping?.trackingNumber ?? '');
  const [error, setError] = useState<string | null>(null);
  const mutation = useUpdateOrderStatus();

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await mutation.mutateAsync({
        id: order.id,
        status,
        trackingNumber: trackingNumber || undefined,
      });
      onHide();
    } catch {
      setError('No se pudo actualizar el estado. Intentá nuevamente.');
    }
  };

  return (
    <Modal show onHide={onHide} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 fw-bold">
          Actualizar orden #{order.orderNumber}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium small">Estado</Form.Label>
            <Form.Select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              size="sm"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
              ))}
            </Form.Select>
          </Form.Group>

          {status === 'SHIPPED' && (
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium small">Número de seguimiento</Form.Label>
              <Form.Control
                type="text"
                size="sm"
                placeholder="Ej: TRC-123456"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </Form.Group>
          )}

          <div className="d-flex gap-2 justify-content-end">
            <Button variant="outline-secondary" size="sm" type="button" onClick={onHide}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <><Spinner size="sm" className="me-1" />Guardando…</>
              ) : (
                'Guardar'
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [editing, setEditing] = useState<AdminOrder | null>(null);

  const query = { page, limit: 20, ...(statusFilter && { status: statusFilter }) };
  const { data, isLoading, isError, refetch } = useAdminOrders(query);

  return (
    <div>
      <div className="admin-page-header d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div>
          <h1>Órdenes de compra</h1>
          <p>Gestión y seguimiento de los pedidos</p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
          onClick={() => refetch()}
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* Filtro de estado */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2 px-3 d-flex align-items-center gap-3 flex-wrap">
          <span className="small fw-medium text-muted">Filtrar por estado:</span>
          <Form.Select
            size="sm"
            style={{ maxWidth: 220 }}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as OrderStatus | '');
              setPage(1);
            }}
          >
            <option value="">Todos los estados</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
            ))}
          </Form.Select>
          {data && (
            <span className="small text-muted ms-auto">
              {data.total} orden{data.total !== 1 ? 'es' : ''}
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
                <th className="ps-3"># Orden</th>
                <th>Cliente</th>
                <th>Items</th>
                <th className="text-end">Total</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th className="pe-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <Spinner animation="border" variant="primary" size="sm" />
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-danger">
                    Error al cargar las órdenes.
                  </td>
                </tr>
              )}
              {data?.items.map((order) => (
                <tr key={order.id}>
                  <td className="ps-3 font-monospace fw-bold text-dark">
                    {order.orderNumber}
                  </td>
                  <td>
                    <div className="fw-medium">{order.user.name}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{order.user.email}</div>
                  </td>
                  <td className="text-muted">{order.items.length} artículo{order.items.length !== 1 && 's'}</td>
                  <td className="text-end fw-semibold">{formatPrice(order.total)}</td>
                  <td>
                    <Badge bg={ORDER_STATUS_VARIANT[order.status]} className="fw-normal">
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </td>
                  <td className="text-muted">
                    {new Date(order.createdAt).toLocaleDateString('es-PY', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="pe-3">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => setEditing(order)}
                    >
                      Estado
                    </Button>
                  </td>
                </tr>
              ))}
              {!isLoading && !isError && data?.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    No hay órdenes para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {data && data.totalPages > 1 && (
          <div className="card-footer bg-transparent border-top d-flex align-items-center justify-content-between px-3 py-2">
            <span className="small text-muted">
              Página {data.page} de {data.totalPages}
            </span>
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={14} />
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal actualización */}
      {editing && (
        <UpdateStatusModal order={editing} onHide={() => setEditing(null)} />
      )}
    </div>
  );
}
