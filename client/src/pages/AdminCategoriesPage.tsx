import React, { useState, useRef } from 'react';
import { Badge, Button, Form, Modal, Alert, Spinner } from 'react-bootstrap';
import { Plus, Edit2, Trash2, RefreshCw, ChevronRight, Star, Upload, X } from 'lucide-react';
import {
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../features/admin';
import { adminService } from '../features/admin/services/admin.service';
import type { AdminCategory, CreateCategoryPayload } from '../features/admin';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Modal Categoría ──────────────────────────────────────────────────────────

interface CategoryModalProps {
  category: AdminCategory | null;
  allCategories: AdminCategory[];
  onHide: () => void;
}

function CategoryModal({ category, allCategories, onHide }: CategoryModalProps) {
  // isEdit solo es true si category tiene un id real (no el dummy de preselectedParent)
  const isEdit = !!(category?.id);
  const createMut = useCreateCategory();
  const updateMut = useUpdateCategory();

  const [name, setName] = useState(category?.name ?? '');
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [parentId, setParentId] = useState<string>(category?.parentId ?? '');
  const [imageUrl, setImageUrl] = useState(category?.imageUrl ?? '');
  const [isFeatured, setIsFeatured] = useState(category?.isFeatured ?? false);
  const [featuredPosition, setFeaturedPosition] = useState(category?.featuredPosition ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const { url } = await adminService.uploadMedia(file);
      setImageUrl(url);
    } catch {
      setUploadError('Error al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEdit) setSlug(toSlug(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload: CreateCategoryPayload = {
      name,
      slug,
      parentId: parentId || undefined,
      imageUrl: imageUrl || undefined,
      isFeatured,
      featuredPosition,
    };
    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: category.id, payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      onHide();
    } catch {
      setError('No se pudo guardar la categoría.');
    }
  };

  // Excluir la propia categoría y sus posibles hijos del selector de padre
  const availableParents = allCategories.filter((c) => c.id !== category?.id);
  const isPending = createMut.isPending || updateMut.isPending || uploading;

  return (
    <Modal show onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">
            {isEdit ? `Editar: ${category.name}` : 'Nueva categoría'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label className="small fw-medium">Nombre</Form.Label>
            <Form.Control
              size="sm"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              placeholder="Ej: Electrónica"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-medium">Slug (URL)</Form.Label>
            <Form.Control
              size="sm"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              pattern="[a-z0-9\-]+"
              placeholder="electronica"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-medium">Categoría padre (opcional)</Form.Label>
            <Form.Select size="sm" value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">— Ninguna (categoría raíz) —</option>
              {availableParents.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </Form.Select>
          </Form.Group>

          {/* Imagen */}
          <Form.Group className="mb-3">
            <Form.Label className="small fw-medium">Imagen de la categoría</Form.Label>
            <div
              className="border rounded d-flex align-items-center justify-content-center position-relative overflow-hidden"
              style={{ height: 120, background: '#f8f9fa', cursor: 'pointer' }}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              {imageUrl ? (
                <>
                  <img src={imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1" style={{ zIndex: 2 }} onClick={(e) => { e.stopPropagation(); setImageUrl(''); }}>
                    <X size={12} />
                  </button>
                </>
              ) : (
                <div className="text-center text-muted" style={{ fontSize: '0.78rem' }}>
                  {uploading ? <><Spinner size="sm" className="me-1" />Subiendo...</> : <><Upload size={16} className="d-block mx-auto mb-1" />Subir imagen</>}
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="d-none" onChange={handleFileSelect} />
            {uploadError && <div className="text-danger" style={{ fontSize: '0.75rem' }}>{uploadError}</div>}
            <Form.Control size="sm" className="mt-2" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="o pegar URL de imagen" />
          </Form.Group>

          {/* Destacada */}
          <Form.Group className="mb-2">
            <Form.Check
              type="switch"
              id="cat-featured"
              label={<span className="small fw-medium">Mostrar como sección destacada en inicio</span>}
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
          </Form.Group>

          {isFeatured && (
            <Form.Group>
              <Form.Label className="small fw-medium">Posición (orden)</Form.Label>
              <Form.Control
                size="sm"
                type="number"
                min={0}
                value={featuredPosition}
                onChange={(e) => setFeaturedPosition(Number(e.target.value))}
                style={{ width: 90 }}
              />
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" type="button" onClick={onHide}>Cancelar</Button>
          <Button type="submit" variant="primary" size="sm" disabled={isPending}>
            {isPending ? <><Spinner size="sm" className="me-1" />Guardando…</> : isEdit ? 'Guardar cambios' : 'Crear categoría'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

// ─── Modal Confirmar eliminación ─────────────────────────────────────────────

interface DeleteConfirmProps {
  category: AdminCategory | null;
  onHide: () => void;
}

function DeleteConfirm({ category, onHide }: DeleteConfirmProps) {
  const mutation = useDeleteCategory();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!category) return;
    setError(null);
    try {
      await mutation.mutateAsync(category.id);
      onHide();
    } catch {
      setError('No se pudo eliminar. Puede que tenga subcategorías o productos asociados.');
    }
  };

  return (
    <Modal show={!!category} onHide={onHide} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 fw-bold text-danger">Eliminar categoría</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
        <p className="small mb-0">
          ¿Eliminar <strong>{category?.name}</strong>? Si tiene subcategorías o productos, la operación fallará.
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

// ─── Fila de categoría (con hijos) ───────────────────────────────────────────

interface CategoryRowProps {
  category: AdminCategory;
  allCategories: AdminCategory[];
  depth?: number;
  onEdit: (cat: AdminCategory) => void;
  onDelete: (cat: AdminCategory) => void;
  onAddChild: (parent: AdminCategory) => void;
}

function CategoryRow({ category, allCategories, depth = 0, onEdit, onDelete, onAddChild }: CategoryRowProps) {
  const children = allCategories.filter((c) => c.parentId === category.id);
  return (
    <>
      <tr>
        <td className="ps-3">
          <div className="d-flex align-items-center gap-1" style={{ paddingLeft: depth * 20 }}>
            {depth > 0 && <ChevronRight size={12} className="text-muted flex-shrink-0" />}
            <span className="fw-medium">{category.name}</span>
          </div>
          <span className="text-muted font-monospace" style={{ fontSize: '0.7rem', paddingLeft: depth * 20 + (depth > 0 ? 16 : 0) }}>{category.slug}</span>
        </td>
        <td>
          {category.parentId ? (
            <Badge bg="light" text="secondary" className="fw-normal">Subcategoría</Badge>
          ) : (
            <Badge bg="primary" className="fw-normal" style={{ opacity: 0.85 }}>Raíz</Badge>
          )}
        </td>
        <td>
          <Badge bg="light" text="secondary" className="fw-normal">{children.length} sub</Badge>
          {category.isFeatured && (
            <Badge bg="warning" text="dark" className="fw-normal ms-1">
              <Star size={10} className="me-1" />Destacada
            </Badge>
          )}
        </td>
        <td className="pe-3 text-end">
          <div className="d-flex gap-1 justify-content-end">
            <Button
              variant="outline-secondary"
              size="sm"
              title="Agregar subcategoría"
              style={{ padding: '2px 7px', fontSize: '0.75rem' }}
              onClick={() => onAddChild(category)}
            >
              + Sub
            </Button>
            <Button
              variant="outline-primary"
              size="sm"
              title="Editar"
              style={{ padding: '2px 7px' }}
              onClick={() => onEdit(category)}
            >
              <Edit2 size={13} />
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              title="Eliminar"
              style={{ padding: '2px 7px' }}
              onClick={() => onDelete(category)}
            >
              <Trash2 size={13} />
            </Button>
          </div>
        </td>
      </tr>
      {children.map((child) => (
        <CategoryRow
          key={child.id}
          category={child}
          allCategories={allCategories}
          depth={depth + 1}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
        />
      ))}
    </>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminCategoriesPage() {
  const { data: categories = [], isLoading, isError, refetch } = useAdminCategories();
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<AdminCategory | null>(null);
  const [preselectedParent, setPreselectedParent] = useState<AdminCategory | null>(null);

  const rootCategories = categories.filter((c) => !c.parentId);
  // Lista plana: raíces + sus hijos, para que CategoryRow y CategoryModal puedan buscar por parentId
  const flatCategories = categories.flatMap((cat) => [cat, ...(cat.children ?? [])]);

  const handleAddChild = (parent: AdminCategory) => {
    setPreselectedParent(parent);
    setShowCreate(true);
  };

  const handleCloseCreate = () => {
    setShowCreate(false);
    setPreselectedParent(null);
  };

  // Categoría sintética para pasar al modal con parentId pre-seleccionado
  const createModalDummy: AdminCategory | null = preselectedParent
    ? { id: '', name: '', slug: '', parentId: preselectedParent.id }
    : null;

  return (
    <div>
      <div className="admin-page-header d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div>
          <h1>Categorías</h1>
          <p>Árbol de categorías del catálogo</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw size={13} />
          </Button>
          <Button variant="primary" size="sm" className="d-flex align-items-center gap-2" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Nueva categoría
          </Button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr>
                <th className="ps-3">Nombre / Slug</th>
                <th>Tipo</th>
                <th>Subcats.</th>
                <th className="pe-3 text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={4} className="text-center py-5"><Spinner animation="border" variant="primary" size="sm" /></td></tr>
              )}
              {isError && (
                <tr><td colSpan={4} className="text-center py-4 text-danger">Error al cargar las categorías.</td></tr>
              )}
              {rootCategories.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  category={cat}
                  allCategories={flatCategories}
                  onEdit={setEditingCategory}
                  onDelete={setDeletingCategory}
                  onAddChild={handleAddChild}
                />
              ))}
              {!isLoading && !isError && categories.length === 0 && (
                <tr><td colSpan={4} className="text-center py-5 text-muted">No hay categorías.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="card-footer bg-transparent border-top px-3 py-2">
          <span className="small text-muted">{flatCategories.length} categorías en total</span>
        </div>
      </div>

      {/* Modales */}
      {showCreate && (
        <CategoryModal
          category={createModalDummy}
          allCategories={flatCategories}
          onHide={handleCloseCreate}
        />
      )}
      {editingCategory && (
        <CategoryModal
          category={editingCategory}
          allCategories={flatCategories}
          onHide={() => setEditingCategory(null)}
        />
      )}
      {deletingCategory && (
        <DeleteConfirm
          category={deletingCategory}
          onHide={() => setDeletingCategory(null)}
        />
      )}
    </div>
  );
}
