import React, { useState } from 'react';
import { Badge, Button, Form, Modal, Alert, Spinner } from 'react-bootstrap';
import { Plus, RefreshCw, ToggleLeft, ToggleRight, Tag, Percent, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useAdminCoupons,
  useCreateCoupon,
  useToggleCoupon,
} from '..';
import { formatPrice } from '../../../shared/utils/formatPrice';
import type { AdminCoupon, CreateCouponPayload, DiscountType } from '..';

// ─── Utilidades ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isExpired(validUntil: string) {
  return new Date(validUntil) < new Date();
}

function localDateValue(iso: string): string {
  // Convierte ISO string a formato YYYY-MM-DD para input[type=date]
  return iso ? iso.slice(0, 10) : '';
}

// ─── Modal Crear cupón ────────────────────────────────────────────────────────

const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

const EMPTY: CreateCouponPayload = {
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: 10,
  minPurchaseAmount: undefined,
  maxUses: undefined,
  validFrom: tomorrow,
  validUntil: nextMonth,
};

interface CreateCouponModalProps {
  onHide: () => void;
}

function CreateCouponModal({ onHide }: CreateCouponModalProps) {
  const mutation = useCreateCoupon();
  const [form, setForm] = useState<CreateCouponPayload>({ ...EMPTY });
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<CreateCouponPayload>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await mutation.mutateAsync(form);
      onHide();
    } catch {
      setError('No se pudo crear el cupón. Verificá que el código sea único.');
    }
  };

  return (
    <Modal show onHide={onHide} centered size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Nuevo cupón de descuento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

          <div className="row g-3">
            <div className="col-12 col-md-5">
              <Form.Group>
                <Form.Label className="small fw-medium">Código</Form.Label>
                <Form.Control
                  size="sm"
                  value={form.code}
                  onChange={(e) => set({ code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                  required
                  placeholder="DESCUENTO20"
                  style={{ fontFamily: 'monospace', fontWeight: 600, letterSpacing: 1 }}
                />
              </Form.Group>
            </div>
            <div className="col-12 col-md-7">
              <Form.Group>
                <Form.Label className="small fw-medium">Descripción (opcional)</Form.Label>
                <Form.Control
                  size="sm"
                  value={form.description ?? ''}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="Descuento del 20% en compras"
                />
              </Form.Group>
            </div>
            <div className="col-6 col-md-4">
              <Form.Group>
                <Form.Label className="small fw-medium">Tipo de descuento</Form.Label>
                <Form.Select
                  size="sm"
                  value={form.discountType}
                  onChange={(e) => set({ discountType: e.target.value as DiscountType })}
                >
                  <option value="PERCENTAGE">Porcentaje (%)</option>
                  <option value="FIXED">Monto fijo (₲)</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-6 col-md-4">
              <Form.Group>
                <Form.Label className="small fw-medium">
                  Valor {form.discountType === 'PERCENTAGE' ? '(%)' : '(₲)'}
                </Form.Label>
                <Form.Control
                  type="number"
                  size="sm"
                  min={0}
                  max={form.discountType === 'PERCENTAGE' ? 100 : undefined}
                  step={form.discountType === 'PERCENTAGE' ? 1 : 100}
                  value={form.discountValue}
                  onChange={(e) => set({ discountValue: Number(e.target.value) })}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-6 col-md-4">
              <Form.Group>
                <Form.Label className="small fw-medium">Compra mínima (₲)</Form.Label>
                <Form.Control
                  type="number"
                  size="sm"
                  min={0}
                  value={form.minPurchaseAmount ?? ''}
                  onChange={(e) => set({ minPurchaseAmount: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Sin mínimo"
                />
              </Form.Group>
            </div>
            <div className="col-6 col-md-4">
              <Form.Group>
                <Form.Label className="small fw-medium">Usos máximos</Form.Label>
                <Form.Control
                  type="number"
                  size="sm"
                  min={1}
                  value={form.maxUses ?? ''}
                  onChange={(e) => set({ maxUses: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Ilimitado"
                />
              </Form.Group>
            </div>
            <div className="col-6 col-md-4">
              <Form.Group>
                <Form.Label className="small fw-medium">Válido desde</Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={form.validFrom}
                  onChange={(e) => set({ validFrom: e.target.value })}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-6 col-md-4">
              <Form.Group>
                <Form.Label className="small fw-medium">Válido hasta</Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={form.validUntil}
                  onChange={(e) => set({ validUntil: e.target.value })}
                  required
                />
              </Form.Group>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" type="button" onClick={onHide}>Cancelar</Button>
          <Button type="submit" variant="primary" size="sm" disabled={mutation.isPending}>
            {mutation.isPending ? <><Spinner size="sm" className="me-1" />Creando…</> : 'Crear cupón'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

// ─── Fila de cupón ────────────────────────────────────────────────────────────

interface CouponRowProps {
  coupon: AdminCoupon;
}

function CouponRow({ coupon }: CouponRowProps) {
  const toggleMut = useToggleCoupon();
  const expired = isExpired(coupon.validUntil);

  return (
    <tr className={expired && coupon.isActive ? 'opacity-50' : undefined}>
      <td className="ps-3">
        <code className="fw-bold" style={{ fontSize: '0.85rem', letterSpacing: 0.5 }}>
          {coupon.code}
        </code>
        {coupon.description && (
          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{coupon.description}</div>
        )}
      </td>
      <td>
        {coupon.discountType === 'PERCENTAGE' ? (
          <Badge bg="info" text="dark" className="d-inline-flex align-items-center gap-1 fw-normal">
            <Percent size={10} /> Porcentaje
          </Badge>
        ) : (
          <Badge bg="warning" text="dark" className="d-inline-flex align-items-center gap-1 fw-normal">
            <DollarSign size={10} /> Monto fijo
          </Badge>
        )}
      </td>
      <td className="fw-semibold text-primary">
        {coupon.discountType === 'PERCENTAGE'
          ? `${coupon.discountValue}%`
          : formatPrice(coupon.discountValue)}
      </td>
      <td className="text-muted small">
        {coupon.minPurchaseAmount ? formatPrice(coupon.minPurchaseAmount) : '—'}
      </td>
      <td>
        <span className="small">
          {coupon.usedCount}
          {coupon.maxUses ? `/${coupon.maxUses}` : ''}
        </span>
        {coupon.maxUses && coupon.usedCount >= coupon.maxUses && (
          <Badge bg="danger" className="ms-1 fw-normal" style={{ fontSize: '0.65rem' }}>Agotado</Badge>
        )}
      </td>
      <td className="small">
        <div>{formatDate(coupon.validFrom)}</div>
        <div className={expired ? 'text-danger fw-medium' : 'text-muted'}>
          → {formatDate(coupon.validUntil)}{expired && ' (vencido)'}
        </div>
      </td>
      <td>
        <Button
          variant="link"
          size="sm"
          className={`p-0 ${coupon.isActive ? 'text-success' : 'text-muted'}`}
          title={coupon.isActive ? 'Desactivar' : 'Activar'}
          onClick={() => toggleMut.mutate(coupon.id)}
          disabled={toggleMut.isPending}
        >
          {coupon.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
        </Button>
      </td>
    </tr>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminPromotionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useAdminCoupons(page, 20);
  const [showCreate, setShowCreate] = useState(false);

  const coupons = data?.items ?? [];
  const totalActive = data?.activeCount ?? 0;
  const totalUses = data?.totalUses ?? 0;

  return (
    <div>
      <div className="admin-page-header d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div>
          <h1>Promociones</h1>
          <p>Gestión de cupones de descuento</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw size={13} />
          </Button>
          <Button variant="primary" size="sm" className="d-flex align-items-center gap-2" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Nuevo cupón
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-3">
        {[
          { label: 'Total cupones', value: data?.total ?? 0, icon: <Tag size={18} />, color: '#0F4C81' },
          { label: 'Activos', value: totalActive, icon: <ToggleRight size={18} />, color: '#198754' },
          { label: 'Total usos', value: totalUses, icon: <Percent size={18} />, color: '#6f42c1' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="col-12 col-sm-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body py-3 d-flex align-items-center gap-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 42, height: 42, background: `${color}15`, color }}
                >
                  {icon}
                </div>
                <div>
                  <div className="fw-bold fs-5 lh-1">{value}</div>
                  <div className="text-muted small">{label}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr>
                <th className="ps-3">Código</th>
                <th>Tipo</th>
                <th>Descuento</th>
                <th>Min. compra</th>
                <th>Usos</th>
                <th>Vigencia</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="text-center py-5"><Spinner animation="border" variant="primary" size="sm" /></td></tr>
              )}
              {isError && (
                <tr><td colSpan={7} className="text-center py-4 text-danger">Error al cargar los cupones.</td></tr>
              )}
              {coupons.map((coupon) => (
                <CouponRow key={coupon.id} coupon={coupon} />
              ))}
              {!isLoading && !isError && coupons.length === 0 && (
                <tr><td colSpan={7} className="text-center py-5 text-muted">No hay cupones creados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {data && data.totalPages > 1 && (
          <div className="card-footer bg-transparent border-top d-flex align-items-center justify-content-between px-3 py-2">
            <span className="small text-muted">
              Página {data.page} de {data.totalPages} · {data.total} cupones
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

      {showCreate && <CreateCouponModal onHide={() => setShowCreate(false)} />}
    </div>
  );
}
