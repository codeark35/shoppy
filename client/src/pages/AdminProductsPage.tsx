import React, { useState } from 'react';
import { Badge, Button, Form, Modal, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { Plus, Edit2, Trash2, Search, RefreshCw, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import {
  useAdminProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useAddVariant,
  useAdminCategories,
} from '../features/admin';
import { formatPrice } from '../shared/utils/formatPrice';
import type {
  AdminProduct,
  AdminProductVariant,
  CreateProductPayload,
  CreateVariantPayload,
} from '../features/admin';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Modal Producto ──────────────────────────────────────────────────────────

const EMPTY_FORM: CreateProductPayload = {
  name: '', slug: '', description: '', basePrice: 0, categoryId: '', isActive: true,
};

interface ProductModalProps {
  product: AdminProduct | null;
  onHide: () => void;
}

function ProductModal({ product, onHide }: ProductModalProps) {
  const isEdit = !!product;
  const { data: categories = [] } = useAdminCategories();
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();
  const [form, setForm] = useState<CreateProductPayload>(
    product
      ? {
          name: product.name,
          slug: product.slug,
          description: product.description,
          basePrice: product.basePrice,
          categoryId: product.category.id,
          isActive: product.isActive,
        }
      : EMPTY_FORM,
  );
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<CreateProductPayload>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleNameChange = (name: string) => {
    set({ name, ...(isEdit ? {} : { slug: toSlug(name) }) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: product.id, payload: form });
      } else {
        await createMut.mutateAsync(form);
      }
      onHide();
    } catch {
      setError('No se pudo guardar el producto. Verificá los datos.');
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <Modal show onHide={onHide} centered size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">
            {isEdit ? `Editar: ${product.name}` : 'Nuevo producto'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

          <div className="row g-3">
            <div className="col-12 col-md-8">
              <Form.Group>
                <Form.Label className="small fw-medium">Nombre</Form.Label>
                <Form.Control
                  size="sm"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-12 col-md-4">
              <Form.Group>
                <Form.Label className="small fw-medium">Slug (URL)</Form.Label>
                <Form.Control
                  size="sm"
                  value={form.slug}
                  onChange={(e) => set({ slug: e.target.value })}
                  required
                  pattern="[a-z0-9\-]+"
                />
              </Form.Group>
            </div>
            <div className="col-12">
              <Form.Group>
                <Form.Label className="small fw-medium">Descripción</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  size="sm"
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-6 col-md-4">
              <Form.Group>
                <Form.Label className="small fw-medium">Precio base (₲)</Form.Label>
                <Form.Control
                  type="number"
                  size="sm"
                  min={0}
                  value={form.basePrice}
                  onChange={(e) => set({ basePrice: Number(e.target.value) })}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-6 col-md-5">
              <Form.Group>
                <Form.Label className="small fw-medium">Categoría</Form.Label>
                <Form.Select
                  size="sm"
                  value={form.categoryId}
                  onChange={(e) => set({ categoryId: e.target.value })}
                  required
                >
                  <option value="">Seleccioná una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-12 col-md-3 d-flex align-items-end">
              <Form.Check
                type="switch"
                id="product-active"
                label={<span className="small fw-medium">Activo</span>}
                checked={form.isActive ?? true}
                onChange={(e) => set({ isActive: e.target.checked })}
                className="mb-1"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" type="button" onClick={onHide}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isPending}>
            {isPending ? <><Spinner size="sm" className="me-1" />Guardando…</> : isEdit ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

// ─── Modal Variante ───────────────────────────────────────────────────────────

interface VariantModalProps {
  product: AdminProduct;
  onHide: () => void;
}

function VariantModal({ product, onHide }: VariantModalProps) {
  const mutation = useAddVariant();
  const [form, setForm] = useState<CreateVariantPayload>({
    sku: '', price: product.basePrice, stock: 0, attributes: {},
  });
  const [attrKey, setAttrKey] = useState('');
  const [attrVal, setAttrVal] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addAttr = () => {
    if (attrKey.trim() && attrVal.trim()) {
      setForm((prev) => ({
        ...prev,
        attributes: { ...prev.attributes, [attrKey.trim()]: attrVal.trim() },
      }));
      setAttrKey('');
      setAttrVal('');
    }
  };

  const removeAttr = (key: string) =>
    setForm((prev) => {
      const next = { ...prev.attributes };
      delete next[key];
      return { ...prev, attributes: next };
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await mutation.mutateAsync({ productId: product.id, payload: form });
      onHide();
    } catch {
      setError('No se pudo agregar la variante.');
    }
  };

  return (
    <Modal show onHide={onHide} centered size="sm">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Nueva variante — {product.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label className="small fw-medium">SKU</Form.Label>
            <Form.Control
              size="sm"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              required
              placeholder="Ej: CAMP-AZUL-M"
            />
          </Form.Group>
          <div className="row g-2 mb-3">
            <div className="col-6">
              <Form.Label className="small fw-medium">Precio (₲)</Form.Label>
              <Form.Control
                type="number"
                size="sm"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                required
              />
            </div>
            <div className="col-6">
              <Form.Label className="small fw-medium">Stock</Form.Label>
              <Form.Control
                type="number"
                size="sm"
                min={0}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <Form.Label className="small fw-medium">Atributos</Form.Label>
          <div className="d-flex gap-2 mb-2">
            <Form.Control size="sm" placeholder="Color" value={attrKey} onChange={(e) => setAttrKey(e.target.value)} />
            <Form.Control size="sm" placeholder="Rojo" value={attrVal} onChange={(e) => setAttrVal(e.target.value)} />
            <Button size="sm" variant="outline-primary" type="button" onClick={addAttr}>+</Button>
          </div>
          {Object.entries(form.attributes).length > 0 && (
            <div className="d-flex flex-wrap gap-1">
              {Object.entries(form.attributes).map(([k, v]) => (
                <Badge
                  key={k}
                  bg="secondary"
                  role="button"
                  style={{ cursor: 'pointer', fontSize: '0.72rem' }}
                  onClick={() => removeAttr(k)}
                  title="Click para eliminar"
                >
                  {k}: {v} ×
                </Badge>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" type="button" onClick={onHide}>Cancelar</Button>
          <Button type="submit" variant="primary" size="sm" disabled={mutation.isPending}>
            {mutation.isPending ? <><Spinner size="sm" className="me-1" />Guardando…</> : 'Agregar variante'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

// ─── Modal Confirmar eliminación ─────────────────────────────────────────────

interface DeleteConfirmProps {
  product: AdminProduct | null;
  onHide: () => void;
}

function DeleteConfirm({ product, onHide }: DeleteConfirmProps) {
  const mutation = useDeleteProduct();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!product) return;
    setError(null);
    try {
      await mutation.mutateAsync(product.id);
      onHide();
    } catch {
      setError('No se pudo eliminar el producto.');
    }
  };

  return (
    <Modal show={!!product} onHide={onHide} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 fw-bold text-danger">Eliminar producto</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
        <p className="small mb-0">
          ¿Eliminar permanentemente <strong>{product?.name}</strong>? Esta acción no se puede deshacer.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" size="sm" onClick={onHide}>Cancelar</Button>
        <Button variant="danger" size="sm" onClick={handleDelete} disabled={mutation.isPending}>
          {mutation.isPending ? <Spinner size="sm" /> : 'Eliminar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ─── Tabla de variantes (inline) ─────────────────────────────────────────────

function VariantsList({ variants }: { variants: AdminProductVariant[] }) {
  if (variants.length === 0) return <span className="text-muted" style={{ fontSize: '0.75rem' }}>Sin variantes</span>;
  return (
    <div className="d-flex flex-wrap gap-1">
      {variants.map((v) => (
        <Badge key={v.id} bg="light" text="dark" style={{ fontSize: '0.7rem' }}>
          {v.sku} · {formatPrice(v.price)} · {v.stock} uds.
        </Badge>
      ))}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<AdminProduct | null>(null);
  const [addingVariantFor, setAddingVariantFor] = useState<AdminProduct | null>(null);

  const { data, isLoading, isError, refetch } = useAdminProducts({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    includeInactive: true,
  });

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((handleSearch as any)._t);
    (handleSearch as any)._t = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  return (
    <div>
      <div className="admin-page-header d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div>
          <h1>Productos</h1>
          <p>Gestión del catálogo de productos</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" className="d-flex align-items-center gap-1" onClick={() => refetch()}>
            <RefreshCw size={13} />
          </Button>
          <Button variant="primary" size="sm" className="d-flex align-items-center gap-2" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Nuevo producto
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2 px-3">
          <InputGroup size="sm" style={{ maxWidth: 320 }}>
            <InputGroup.Text><Search size={13} /></InputGroup.Text>
            <Form.Control
              placeholder="Buscar por nombre…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </InputGroup>
        </div>
      </div>

      {/* Tabla */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr>
                <th className="ps-3">Producto</th>
                <th>Categoría</th>
                <th>Precio base</th>
                <th>Variantes</th>
                <th>Estado</th>
                <th className="pe-3 text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} className="text-center py-5"><Spinner animation="border" variant="primary" size="sm" /></td></tr>
              )}
              {isError && (
                <tr><td colSpan={6} className="text-center py-4 text-danger">Error al cargar los productos.</td></tr>
              )}
              {data?.items.map((product) => (
                <tr key={product.id}>
                  <td className="ps-3">
                    <div className="fw-medium text-dark">{product.name}</div>
                    <div className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>{product.slug}</div>
                  </td>
                  <td>
                    <Badge bg="light" text="secondary" className="fw-normal">{product.category?.name ?? '—'}</Badge>
                  </td>
                  <td className="fw-semibold">{formatPrice(product.basePrice)}</td>
                  <td><VariantsList variants={product.variants ?? []} /></td>
                  <td>
                    <Badge bg={product.isActive ? 'success' : 'secondary'} className="fw-normal">
                      {product.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="pe-3 text-end">
                    <div className="d-flex gap-1 justify-content-end">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        title="Agregar variante"
                        style={{ padding: '2px 7px' }}
                        onClick={() => setAddingVariantFor(product)}
                      >
                        <PlusCircle size={13} />
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        title="Editar"
                        style={{ padding: '2px 7px' }}
                        onClick={() => setEditingProduct(product)}
                      >
                        <Edit2 size={13} />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        title="Eliminar"
                        style={{ padding: '2px 7px' }}
                        onClick={() => setDeletingProduct(product)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !isError && data?.items.length === 0 && (
                <tr><td colSpan={6} className="text-center py-5 text-muted">No hay productos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Paginación */}
        {data && data.totalPages > 1 && (
          <div className="card-footer bg-transparent border-top d-flex align-items-center justify-content-between px-3 py-2">
            <span className="small text-muted">Página {data.page} de {data.totalPages} · {data.total} productos</span>
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

      {/* Modales */}
      {showCreate && <ProductModal product={null} onHide={() => setShowCreate(false)} />}
      {editingProduct && <ProductModal product={editingProduct} onHide={() => setEditingProduct(null)} />}
      {deletingProduct && <DeleteConfirm product={deletingProduct} onHide={() => setDeletingProduct(null)} />}
      {addingVariantFor && <VariantModal product={addingVariantFor} onHide={() => setAddingVariantFor(null)} />}
    </div>
  );
}
