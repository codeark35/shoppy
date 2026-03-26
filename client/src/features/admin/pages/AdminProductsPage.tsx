import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Form, Modal, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { Plus, Edit2, Trash2, Search, RefreshCw, ChevronLeft, ChevronRight, PlusCircle, Image } from 'lucide-react';
import { useVirtualList } from '../../../shared/hooks/useVirtualList';
import {
  useAdminProducts,
  useDeleteProduct,
  useAddVariant,
} from '..';
import { formatPrice } from '../../../shared/utils/formatPrice';
import type {
  AdminProduct,
  AdminProductVariant,
  CreateVariantPayload,
} from '..';

// ─ Límite de items por página para scroll virtual
const VIRTUAL_PAGE_SIZE = 100;

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
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deletingProduct, setDeletingProduct] = useState<AdminProduct | null>(null);
  const [addingVariantFor, setAddingVariantFor] = useState<AdminProduct | null>(null);

  const { data, isLoading, isError, refetch } = useAdminProducts({
    page,
    limit: VIRTUAL_PAGE_SIZE,
    search: debouncedSearch || undefined,
    includeInactive: true,
  });

  const products = data?.items ?? [];

  const { containerRef, virtualItems, totalSize, measureElement } = useVirtualList({
    count: products.length,
    estimateSize: 64,
    overscan: 5,
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
          <Button variant="primary" size="sm" className="d-flex align-items-center gap-2" onClick={() => navigate('/admin/productos/nuevo')}>
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

      {/* Tabla con scroll virtual */}
      <div className="card border-0 shadow-sm">
        <div
          ref={containerRef}
          style={{ height: 560, overflowY: 'auto' }}
        >
          <table className="table table-hover align-middle mb-0 small" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: '35%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '9%' }} />
            </colgroup>
            <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th className="ps-3">Producto</th>
                <th>Categoría</th>
                <th>Precio base</th>
                <th>Variantes</th>
                <th>Estado</th>
                <th className="pe-3 text-end">Acciones</th>
              </tr>
            </thead>
            <tbody style={{ position: 'relative', height: isLoading || products.length === 0 ? undefined : totalSize }}>
              {isLoading && (
                <tr><td colSpan={6} className="text-center py-5"><Spinner animation="border" variant="primary" size="sm" /></td></tr>
              )}
              {isError && (
                <tr><td colSpan={6} className="text-center py-4 text-danger">Error al cargar los productos.</td></tr>
              )}
              {!isLoading && !isError && products.length === 0 && (
                <tr><td colSpan={6} className="text-center py-5 text-muted">No hay productos.</td></tr>
              )}
              {virtualItems.map((vRow) => {
                const product = products[vRow.index];
                if (!product) return null;
                return (
                  <tr
                    key={product.id}
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
                      <div className="d-flex align-items-center gap-2">
                        <div className="d-flex gap-1" style={{ flexShrink: 0 }}>
                          {product.images && product.images.length > 0 ? (
                            <>
                              <div
                                style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', border: '1px solid #dee2e6', background: '#f8f9fa', flexShrink: 0 }}
                              >
                                <img
                                  src={product.images[0].url}
                                  alt={product.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40?text=?'; }}
                                />
                              </div>
                              {product.images.length > 1 && (
                                <span
                                  className="d-flex align-items-center justify-content-center text-muted"
                                  style={{ width: 22, height: 40, fontSize: '0.68rem', fontWeight: 600 }}
                                  title={`${product.images.length} imágenes`}
                                >
                                  +{product.images.length - 1}
                                </span>
                              )}
                            </>
                          ) : (
                            <div
                              className="d-flex align-items-center justify-content-center"
                              style={{ width: 40, height: 40, borderRadius: 6, border: '1px dashed #ced4da', background: '#f8f9fa', flexShrink: 0 }}
                            >
                              <Image size={16} className="text-muted" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="fw-medium text-dark">{product.name}</div>
                          <div className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>{product.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ width: '12%' }}>
                      <Badge bg="light" text="secondary" className="fw-normal">{product.category?.name ?? '—'}</Badge>
                    </td>
                    <td className="fw-semibold" style={{ width: '12%' }}>{formatPrice(product.basePrice)}</td>
                    <td style={{ width: '22%' }}><VariantsList variants={product.variants ?? []} /></td>
                    <td style={{ width: '10%' }}>
                      <div className="d-flex flex-column gap-1">
                        <Badge bg={product.isActive ? 'success' : 'secondary'} className="fw-normal">
                          {product.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                        {product.isFeatured && (
                          <Badge bg="warning" text="dark" className="fw-normal" style={{ fontSize: '0.65rem' }}>
                            ★ Destacado
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="pe-3 text-end" style={{ width: '9%' }}>
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
                          onClick={() => navigate(`/admin/productos/${product.id}/editar`, { state: { product } })}
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
                );
              })}
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
      {deletingProduct && <DeleteConfirm product={deletingProduct} onHide={() => setDeletingProduct(null)} />}
      {addingVariantFor && <VariantModal product={addingVariantFor} onHide={() => setAddingVariantFor(null)} />}
    </div>
  );
}
