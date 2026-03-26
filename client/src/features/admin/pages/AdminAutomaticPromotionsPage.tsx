import React, { useState, useEffect } from 'react';
import { Badge, Button, Form, Modal, Alert, Spinner } from 'react-bootstrap';
import {
  Plus,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Percent,
  DollarSign,
  Pencil,
  Trash2,
  Package,
  Tag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  useAdminPromotions,
  useAdminPromotionById,
  useCreatePromotion,
  useUpdatePromotion,
  useTogglePromotion,
  useDeletePromotion,
  useAdminProducts,
  useAdminCategories,
} from '..';
import { formatPrice } from '../../../shared/utils/formatPrice';
import type {
  AdminPromotion,
  CreatePromotionPayload,
  DiscountType,
  PromotionScope,
} from '..';

// ─── Utilidades ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isExpired(validUntil?: string) {
  if (!validUntil) return false;
  return new Date(validUntil) < new Date();
}

function isActive(promo: AdminPromotion) {
  return promo.isActive && !isExpired(promo.validUntil);
}

const today = new Date().toISOString().slice(0, 10);
const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

const EMPTY: CreatePromotionPayload = {
  name: '',
  description: '',
  scope: 'PRODUCT',
  discountType: 'PERCENTAGE',
  discountValue: 10,
  minPurchaseAmount: undefined,
  priority: 0,
  combinable: false,
  validFrom: today,
  validUntil: nextMonth,
  isActive: true,
  productIds: [],
  categoryIds: [],
};

// ─── Modal Crear / Editar promoción ───────────────────────────────────────────

interface PromotionModalProps {
  editId: string | null;
  onHide: () => void;
}

function PromotionModal({ editId, onHide }: PromotionModalProps) {
  const isEditing = !!editId;

  const { data: existing, isLoading: loadingExisting } = useAdminPromotionById(editId);
  const createMut = useCreatePromotion();
  const updateMut = useUpdatePromotion();

  const { data: productsData } = useAdminProducts({ limit: 200 });
  const { data: categories } = useAdminCategories();

  const [form, setForm] = useState<CreatePromotionPayload>({ ...EMPTY });
  const [error, setError] = useState<string | null>(null);

  // Rellenar formulario al editar
  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        description: existing.description ?? '',
        scope: existing.scope,
        discountType: existing.discountType,
        discountValue: existing.discountValue,
        minPurchaseAmount: existing.minPurchaseAmount,
        priority: existing.priority,
        combinable: existing.combinable,
        validFrom: existing.validFrom.slice(0, 10),
        validUntil: existing.validUntil ? existing.validUntil.slice(0, 10) : '',
        isActive: existing.isActive,
        productIds: existing.products.map((p) => p.productId),
        categoryIds: existing.categories.map((c) => c.categoryId),
      });
    }
  }, [existing]);

  const set = (patch: Partial<CreatePromotionPayload>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const toggleId = (
    list: string[],
    id: string,
  ): string[] =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const productIds =
      form.scope === 'PRODUCT' && (form.productIds ?? []).length > 0
        ? form.productIds
        : undefined;
    const categoryIds =
      form.scope === 'CATEGORY' && (form.categoryIds ?? []).length > 0
        ? form.categoryIds
        : undefined;

    const payload: CreatePromotionPayload = {
      ...form,
      minPurchaseAmount: form.minPurchaseAmount || undefined,
      validUntil: form.validUntil || undefined,
      productIds,
      categoryIds,
    };

    try {
      if (isEditing) {
        await updateMut.mutateAsync({ id: editId!, payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      onHide();
    } catch {
      setError('No se pudo guardar la promoción. Verificá los datos e intentá de nuevo.');
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  if (isEditing && loadingExisting) {
    return (
      <Modal show onHide={onHide} centered>
        <Modal.Body className="d-flex justify-content-center py-5">
          <Spinner animation="border" size="sm" />
        </Modal.Body>
      </Modal>
    );
  }

  const products = productsData?.items ?? [];
  const flatCategories = categories ?? [];

  return (
    <Modal show onHide={onHide} centered size="lg" scrollable>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">
            {isEditing ? 'Editar promoción automática' : 'Nueva promoción automática'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

          <div className="row g-3">
            {/* Nombre */}
            <div className="col-12">
              <Form.Group>
                <Form.Label className="small fw-medium">Nombre de la promoción</Form.Label>
                <Form.Control
                  size="sm"
                  value={form.name}
                  onChange={(e) => set({ name: e.target.value })}
                  required
                  placeholder="Ej: 20% en electrónica"
                />
              </Form.Group>
            </div>

            {/* Descripción */}
            <div className="col-12">
              <Form.Group>
                <Form.Label className="small fw-medium">Descripción (opcional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  size="sm"
                  value={form.description ?? ''}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="Descripción interna de la promoción"
                />
              </Form.Group>
            </div>

            {/* Alcance */}
            <div className="col-6 col-md-4">
              <Form.Group>
                <Form.Label className="small fw-medium">Alcance</Form.Label>
                <Form.Select
                  size="sm"
                  value={form.scope}
                  onChange={(e) =>
                    set({ scope: e.target.value as PromotionScope, productIds: [], categoryIds: [] })
                  }
                >
                  <option value="PRODUCT">Por producto</option>
                  <option value="CATEGORY">Por categoría</option>
                </Form.Select>
              </Form.Group>
            </div>

            {/* Tipo descuento */}
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

            {/* Valor */}
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

            {/* Compra mínima */}
            <div className="col-6 col-md-4">
              <Form.Group>
                <Form.Label className="small fw-medium">Compra mínima (₲)</Form.Label>
                <Form.Control
                  type="number"
                  size="sm"
                  min={0}
                  value={form.minPurchaseAmount ?? ''}
                  onChange={(e) =>
                    set({ minPurchaseAmount: e.target.value ? Number(e.target.value) : undefined })
                  }
                  placeholder="Sin mínimo"
                />
              </Form.Group>
            </div>

            {/* Prioridad */}
            <div className="col-6 col-md-4">
              <Form.Group>
                <Form.Label className="small fw-medium">Prioridad</Form.Label>
                <Form.Control
                  type="number"
                  size="sm"
                  min={0}
                  value={form.priority ?? 0}
                  onChange={(e) => set({ priority: Number(e.target.value) })}
                />
                <Form.Text className="text-muted" style={{ fontSize: '0.7rem' }}>
                  Mayor número = mayor prioridad en colisiones
                </Form.Text>
              </Form.Group>
            </div>

            {/* Válido desde / hasta */}
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
                <Form.Label className="small fw-medium">Válido hasta (opcional)</Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={form.validUntil ?? ''}
                  onChange={(e) => set({ validUntil: e.target.value })}
                />
              </Form.Group>
            </div>

            {/* Switches */}
            <div className="col-12 col-md-8 d-flex gap-4 align-items-center">
              <Form.Check
                type="switch"
                id="promo-active"
                label="Activa"
                checked={form.isActive ?? true}
                onChange={(e) => set({ isActive: e.target.checked })}
              />
              <Form.Check
                type="switch"
                id="promo-combinable"
                label="Combinable con cupón"
                checked={form.combinable ?? false}
                onChange={(e) => set({ combinable: e.target.checked })}
              />
            </div>

            {/* Selector de productos */}
            {form.scope === 'PRODUCT' && (
              <div className="col-12">
                <Form.Label className="small fw-medium">
                  Productos que aplican{' '}
                  <span className="text-muted fw-normal">
                    ({(form.productIds ?? []).length} seleccionados)
                  </span>
                </Form.Label>
                <div
                  className="border rounded p-2"
                  style={{ maxHeight: 220, overflowY: 'auto', background: '#fafafa' }}
                >
                  {products.length === 0 ? (
                    <div className="text-muted small py-2 text-center">Cargando productos…</div>
                  ) : (
                    products.map((p) => (
                      <Form.Check
                        key={p.id}
                        type="checkbox"
                        id={`prod-${p.id}`}
                        label={p.name}
                        className="small mb-1"
                        checked={(form.productIds ?? []).includes(p.id)}
                        onChange={() =>
                          set({ productIds: toggleId(form.productIds ?? [], p.id) })
                        }
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Selector de categorías */}
            {form.scope === 'CATEGORY' && (
              <div className="col-12">
                <Form.Label className="small fw-medium">
                  Categorías que aplican{' '}
                  <span className="text-muted fw-normal">
                    ({(form.categoryIds ?? []).length} seleccionadas)
                  </span>
                </Form.Label>
                <div
                  className="border rounded p-2"
                  style={{ maxHeight: 220, overflowY: 'auto', background: '#fafafa' }}
                >
                  {flatCategories.length === 0 ? (
                    <div className="text-muted small py-2 text-center">Cargando categorías…</div>
                  ) : (
                    flatCategories.map((c) => (
                      <Form.Check
                        key={c.id}
                        type="checkbox"
                        id={`cat-${c.id}`}
                        label={c.name}
                        className="small mb-1"
                        checked={(form.categoryIds ?? []).includes(c.id)}
                        onChange={() =>
                          set({ categoryIds: toggleId(form.categoryIds ?? [], c.id) })
                        }
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" type="button" onClick={onHide}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isPending}>
            {isPending ? (
              <>
                <Spinner size="sm" className="me-1" />
                {isEditing ? 'Guardando…' : 'Creando…'}
              </>
            ) : isEditing ? (
              'Guardar cambios'
            ) : (
              'Crear promoción'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

// ─── Confirmación de eliminación ──────────────────────────────────────────────

interface DeleteConfirmProps {
  promo: AdminPromotion;
  onHide: () => void;
}

function DeleteConfirmModal({ promo, onHide }: DeleteConfirmProps) {
  const deleteMut = useDeletePromotion();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    try {
      await deleteMut.mutateAsync(promo.id);
      onHide();
    } catch {
      setError('No se pudo eliminar la promoción.');
    }
  };

  return (
    <Modal show onHide={onHide} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 fw-bold">Eliminar promoción</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
        <p className="small mb-0">
          ¿Eliminar <strong>{promo.name}</strong>? Esta acción no se puede deshacer.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" size="sm" onClick={onHide}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={handleDelete}
          disabled={deleteMut.isPending}
        >
          {deleteMut.isPending ? <Spinner size="sm" /> : 'Eliminar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ─── Fila de promoción ────────────────────────────────────────────────────────

interface PromotionRowProps {
  promo: AdminPromotion;
  onEdit: (id: string) => void;
  onDelete: (promo: AdminPromotion) => void;
}

function PromotionRow({ promo, onEdit, onDelete }: PromotionRowProps) {
  const toggleMut = useTogglePromotion();
  const active = isActive(promo);
  const expired = isExpired(promo.validUntil);

  const targetCount =
    promo.scope === 'PRODUCT' ? promo.products.length : promo.categories.length;

  return (
    <tr className={!active ? 'opacity-60' : undefined}>
      <td className="ps-3">
        <div className="fw-semibold small">{promo.name}</div>
        {promo.description && (
          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
            {promo.description}
          </div>
        )}
      </td>
      <td>
        {promo.scope === 'PRODUCT' ? (
          <Badge bg="light" text="dark" className="d-inline-flex align-items-center gap-1 border fw-normal">
            <Package size={10} /> Producto
          </Badge>
        ) : (
          <Badge bg="light" text="dark" className="d-inline-flex align-items-center gap-1 border fw-normal">
            <Tag size={10} /> Categoría
          </Badge>
        )}
        <div className="text-muted mt-1" style={{ fontSize: '0.68rem' }}>
          {targetCount} {promo.scope === 'PRODUCT' ? 'productos' : 'categorías'}
        </div>
      </td>
      <td>
        {promo.discountType === 'PERCENTAGE' ? (
          <Badge bg="info" text="dark" className="d-inline-flex align-items-center gap-1 fw-normal">
            <Percent size={10} /> %
          </Badge>
        ) : (
          <Badge bg="warning" text="dark" className="d-inline-flex align-items-center gap-1 fw-normal">
            <DollarSign size={10} /> Fijo
          </Badge>
        )}
      </td>
      <td className="fw-semibold text-primary">
        {promo.discountType === 'PERCENTAGE'
          ? `${promo.discountValue}%`
          : formatPrice(promo.discountValue)}
      </td>
      <td className="small">
        <div>{formatDate(promo.validFrom)}</div>
        {promo.validUntil ? (
          <div className={expired ? 'text-danger fw-medium' : 'text-muted'}>
            → {formatDate(promo.validUntil)}{expired && ' (vencido)'}
          </div>
        ) : (
          <div className="text-muted">→ Sin vencimiento</div>
        )}
      </td>
      <td className="text-center small text-muted">{promo.priority}</td>
      <td className="text-center">
        {promo.combinable ? (
          <Badge bg="success" className="fw-normal" style={{ fontSize: '0.65rem' }}>Sí</Badge>
        ) : (
          <Badge bg="secondary" className="fw-normal" style={{ fontSize: '0.65rem' }}>No</Badge>
        )}
      </td>
      <td>
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="link"
            size="sm"
            className={`p-0 ${active ? 'text-success' : 'text-muted'}`}
            title={promo.isActive ? 'Desactivar' : 'Activar'}
            onClick={() => toggleMut.mutate({ id: promo.id, isActive: !promo.isActive })}
            disabled={toggleMut.isPending}
          >
            {promo.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
          </Button>
          <Button
            variant="link"
            size="sm"
            className="p-0 text-secondary"
            title="Editar"
            onClick={() => onEdit(promo.id)}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="link"
            size="sm"
            className="p-0 text-danger"
            title="Eliminar"
            onClick={() => onDelete(promo)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </td>
    </tr>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminAutomaticPromotionsPage() {
  const [page, setPage] = useState(1);
  const [scopeFilter, setScopeFilter] = useState<'' | 'PRODUCT' | 'CATEGORY'>('');
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');
  const [search, setSearch] = useState('');

  const query = {
    page,
    limit: 20,
    ...(scopeFilter && { scope: scopeFilter as 'PRODUCT' | 'CATEGORY' }),
    ...(activeFilter !== '' && { isActive: activeFilter === 'true' }),
    ...(search && { search }),
  };

  const { data, isLoading, isError, refetch } = useAdminPromotions(query);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deletePromo, setDeletePromo] = useState<AdminPromotion | null>(null);

  const promotions = data?.items ?? [];
  const totalActive = promotions.filter((p) => isActive(p)).length;

  const handleFilterChange = () => setPage(1);

  return (
    <div>
      {/* Encabezado */}
      <div className="admin-page-header d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div>
          <h1>Promociones automáticas</h1>
          <p>Descuentos por producto o categoría — se aplican sin código</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw size={13} />
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="d-flex align-items-center gap-2"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={14} /> Nueva promoción
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-3">
        {[
          { label: 'Total', value: data?.total ?? 0, icon: <Percent size={18} />, color: '#0F4C81' },
          { label: 'Activas', value: totalActive, icon: <ToggleRight size={18} />, color: '#198754' },
        ].map(({ label, value, icon, color }) => (
          <div className="col-6 col-md-3" key={label}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body py-3 d-flex align-items-center gap-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 40, height: 40, background: `${color}15`, color }}
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

      {/* Filtros */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2 px-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-sm-4">
              <Form.Control
                size="sm"
                placeholder="Buscar por nombre…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); handleFilterChange(); }}
              />
            </div>
            <div className="col-6 col-sm-3">
              <Form.Select
                size="sm"
                value={scopeFilter}
                onChange={(e) => { setScopeFilter(e.target.value as '' | 'PRODUCT' | 'CATEGORY'); handleFilterChange(); }}
              >
                <option value="">Todos los alcances</option>
                <option value="PRODUCT">Por producto</option>
                <option value="CATEGORY">Por categoría</option>
              </Form.Select>
            </div>
            <div className="col-6 col-sm-3">
              <Form.Select
                size="sm"
                value={activeFilter}
                onChange={(e) => { setActiveFilter(e.target.value as '' | 'true' | 'false'); handleFilterChange(); }}
              >
                <option value="">Todos los estados</option>
                <option value="true">Solo activas</option>
                <option value="false">Solo inactivas</option>
              </Form.Select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="d-flex justify-content-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : isError ? (
            <div className="p-4">
              <Alert variant="danger" className="mb-0">
                Error al cargar las promociones.{' '}
                <Button variant="link" size="sm" className="p-0" onClick={() => refetch()}>
                  Reintentar
                </Button>
              </Alert>
            </div>
          ) : promotions.length === 0 ? (
            <div className="text-center text-muted py-5 small">
              No hay promociones que coincidan con los filtros.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th className="ps-3">Nombre</th>
                    <th>Alcance</th>
                    <th>Tipo</th>
                    <th>Descuento</th>
                    <th>Vigencia</th>
                    <th className="text-center">Prioridad</th>
                    <th className="text-center">Combinable</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {promotions.map((promo) => (
                    <PromotionRow
                      key={promo.id}
                      promo={promo}
                      onEdit={(id) => setEditId(id)}
                      onDelete={(p) => setDeletePromo(p)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {(data?.totalPages ?? 1) > 1 && (
            <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top small text-muted">
              <span>
                Página {data?.page} de {data?.totalPages} — {data?.total} promociones
              </span>
              <div className="d-flex gap-1">
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
                  disabled={page >= (data?.totalPages ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {(showCreate || editId) && (
        <PromotionModal
          editId={editId}
          onHide={() => { setShowCreate(false); setEditId(null); }}
        />
      )}
      {deletePromo && (
        <DeleteConfirmModal
          promo={deletePromo}
          onHide={() => setDeletePromo(null)}
        />
      )}
    </div>
  );
}
