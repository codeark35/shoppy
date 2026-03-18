import { useState, useRef } from 'react';
import {
  Container, Table, Badge, Button, Modal, Form,
  Row, Col, Spinner, Alert,
} from 'react-bootstrap';
import { Plus, Pencil, Trash2, Image, ToggleLeft, ToggleRight, Upload, X } from 'lucide-react';
import { adminService } from '../features/admin/services/admin.service';
import {
  useAdminBanners,
  useCreateBanner,
  useUpdateBanner,
  useToggleBanner,
  useDeleteBanner,
} from '../features/admin/hooks/useAdmin';
import type { AdminBanner, CreateBannerPayload, BannerType } from '../features/admin/types/admin.types';

// ── Formulario ────────────────────────────────────────────────────────────────

interface BannerForm {
  title: string;
  subtitle: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
  type: BannerType;
  isActive: boolean;
  position: number;
  validFrom: string;
  validUntil: string;
}

const EMPTY_FORM: BannerForm = {
  title: '',
  subtitle: '',
  imageUrl: '',
  buttonText: '',
  buttonLink: '',
  type: 'HERO',
  isActive: true,
  position: 0,
  validFrom: '',
  validUntil: '',
};

interface BannerModalProps {
  show: boolean;
  onHide: () => void;
  editing: AdminBanner | null;
}

function BannerModal({ show, onHide, editing }: BannerModalProps) {
  const [form, setForm] = useState<BannerForm>(() =>
    editing
      ? {
          title: editing.title,
          subtitle: editing.subtitle ?? '',
          imageUrl: editing.imageUrl,
          buttonText: editing.buttonText ?? '',
          buttonLink: editing.buttonLink ?? '',
          type: editing.type,
          isActive: editing.isActive,
          position: editing.position,
          validFrom: editing.validFrom ? editing.validFrom.slice(0, 10) : '',
          validUntil: editing.validUntil ? editing.validUntil.slice(0, 10) : '',
        }
      : EMPTY_FORM,
  );
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const { url } = await adminService.uploadMedia(file);
      set('imageUrl', url);
    } catch {
      setUploadError('Error al subir la imagen. Intentá de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const set = (k: keyof BannerForm, v: string | boolean | number) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('El título es obligatorio.'); return; }
    if (!form.imageUrl.trim()) { setError('La URL de imagen es obligatoria.'); return; }
    setError('');

    const payload: CreateBannerPayload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || undefined,
      imageUrl: form.imageUrl.trim(),
      buttonText: form.buttonText.trim() || undefined,
      buttonLink: form.buttonLink.trim() || undefined,
      type: form.type,
      isActive: form.isActive,
      position: form.position,
      validFrom: form.validFrom || undefined,
      validUntil: form.validUntil || undefined,
    };

    try {
      if (editing) {
        await updateBanner.mutateAsync({ id: editing.id, payload });
      } else {
        await createBanner.mutateAsync(payload);
      }
      onHide();
    } catch {
      setError('Ocurrió un error al guardar el banner.');
    }
  };

  const isBusy = createBanner.isPending || updateBanner.isPending || uploading;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold fs-6">
          {editing ? 'Editar banner' : 'Nuevo banner'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
        <Row className="g-3">
          <Col md={8}>
            <Form.Label className="small fw-semibold">Título *</Form.Label>
            <Form.Control
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ej: Nueva temporada 2026"
            />
          </Col>
          <Col md={4}>
            <Form.Label className="small fw-semibold">Tipo</Form.Label>
            <Form.Select value={form.type} onChange={(e) => set('type', e.target.value as BannerType)}>
              <option value="HERO">Hero (principal)</option>
              <option value="PROMO">Promo</option>
            </Form.Select>
          </Col>
          <Col xs={12}>
            <Form.Label className="small fw-semibold">Subtítulo</Form.Label>
            <Form.Control
              value={form.subtitle}
              onChange={(e) => set('subtitle', e.target.value)}
              placeholder="Descripción corta del banner"
            />
          </Col>
          <Col xs={12}>
            <Form.Label className="small fw-semibold">Imagen del banner *</Form.Label>

            {/* Zona de preview / drop */}
            <div
              className="border rounded d-flex align-items-center justify-content-center position-relative overflow-hidden"
              style={{ height: 160, background: '#f8f9fa', cursor: 'pointer' }}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              {form.imageUrl ? (
                <>
                  <img
                    src={form.imageUrl}
                    alt="preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                    style={{ zIndex: 2 }}
                    onClick={(e) => { e.stopPropagation(); set('imageUrl', ''); }}
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <div className="text-center text-muted small">
                  {uploading
                    ? <><Spinner size="sm" className="me-2" />Subiendo imagen...</>
                    : <><Upload size={20} className="d-block mx-auto mb-1" />Hacer clic para subir imagen</>}
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="d-none"
              onChange={handleFileSelect}
            />

            {uploadError && <div className="text-danger small mt-1">{uploadError}</div>}

            {/* Fallback: pegar URL manualmente */}
            <div className="mt-2 d-flex align-items-center gap-2">
              <span className="text-muted small text-nowrap">o pegar URL:</span>
              <Form.Control
                size="sm"
                value={form.imageUrl}
                onChange={(e) => set('imageUrl', e.target.value)}
                placeholder="https://ejemplo.com/banner.jpg"
              />
            </div>
          </Col>
          <Col md={6}>
            <Form.Label className="small fw-semibold">Texto del botón</Form.Label>
            <Form.Control
              value={form.buttonText}
              onChange={(e) => set('buttonText', e.target.value)}
              placeholder="Ver catálogo"
            />
          </Col>
          <Col md={6}>
            <Form.Label className="small fw-semibold">Link del botón</Form.Label>
            <Form.Control
              value={form.buttonLink}
              onChange={(e) => set('buttonLink', e.target.value)}
              placeholder="/productos"
            />
          </Col>
          <Col md={4}>
            <Form.Label className="small fw-semibold">Posición (orden)</Form.Label>
            <Form.Control
              type="number"
              min={0}
              value={form.position}
              onChange={(e) => set('position', Number(e.target.value))}
            />
          </Col>
          <Col md={4}>
            <Form.Label className="small fw-semibold">Válido desde</Form.Label>
            <Form.Control
              type="date"
              value={form.validFrom}
              onChange={(e) => set('validFrom', e.target.value)}
            />
          </Col>
          <Col md={4}>
            <Form.Label className="small fw-semibold">Válido hasta</Form.Label>
            <Form.Control
              type="date"
              value={form.validUntil}
              onChange={(e) => set('validUntil', e.target.value)}
            />
          </Col>
          <Col xs={12}>
            <Form.Check
              type="switch"
              id="banner-active"
              label="Banner activo"
              checked={form.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
            />
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={isBusy}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={isBusy}>
          {isBusy ? <Spinner size="sm" /> : editing ? 'Guardar cambios' : 'Crear banner'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ── Fila de tabla ─────────────────────────────────────────────────────────────

interface BannerRowProps {
  banner: AdminBanner;
  onEdit: (b: AdminBanner) => void;
  onDelete: (b: AdminBanner) => void;
}

function BannerRow({ banner, onEdit, onDelete }: BannerRowProps) {
  const toggle = useToggleBanner();
  return (
    <tr>
      <td style={{ width: 64 }}>
        {banner.imageUrl ? (
          <img
            src={banner.imageUrl}
            alt={banner.title}
            style={{ width: 56, height: 36, objectFit: 'cover', borderRadius: 6 }}
            onError={(e) => { (e.target as HTMLImageElement).replaceWith(document.createTextNode('—')); }}
          />
        ) : (
          <Image size={20} className="text-muted" />
        )}
      </td>
      <td>
        <div className="fw-semibold small">{banner.title}</div>
        {banner.subtitle && <div className="text-muted" style={{ fontSize: '0.75rem' }}>{banner.subtitle}</div>}
      </td>
      <td>
        <Badge bg={banner.type === 'HERO' ? 'primary' : 'warning'} className="text-uppercase" style={{ fontSize: '0.65rem' }}>
          {banner.type}
        </Badge>
      </td>
      <td className="text-center">{banner.position}</td>
      <td className="text-center">
        <button
          className="btn btn-link p-0 border-0"
          style={{ color: banner.isActive ? '#16A34A' : '#6B7280' }}
          onClick={() => toggle.mutate({ id: banner.id, isActive: !banner.isActive })}
          title={banner.isActive ? 'Desactivar' : 'Activar'}
        >
          {banner.isActive
            ? <ToggleRight size={22} />
            : <ToggleLeft size={22} />}
        </button>
      </td>
      <td>
        {banner.validFrom && (
          <span className="small text-muted">
            {new Date(banner.validFrom).toLocaleDateString('es-PY')}
            {banner.validUntil && ` → ${new Date(banner.validUntil).toLocaleDateString('es-PY')}`}
          </span>
        )}
      </td>
      <td>
        <div className="d-flex gap-2 justify-content-end">
          <Button size="sm" variant="outline-primary" onClick={() => onEdit(banner)}>
            <Pencil size={14} />
          </Button>
          <Button size="sm" variant="outline-danger" onClick={() => onDelete(banner)}>
            <Trash2 size={14} />
          </Button>
        </div>
      </td>
    </tr>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function AdminBannersPage() {
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminBanner | null>(null);
  const [toDelete, setToDelete] = useState<AdminBanner | null>(null);

  const { data: banners, isLoading, isError } = useAdminBanners(
    typeFilter ? { type: typeFilter } : undefined,
  );
  const deleteBanner = useDeleteBanner();

  const openCreate = () => { setEditing(null); setShowModal(true); };
  const openEdit   = (b: AdminBanner) => { setEditing(b); setShowModal(true); };

  const handleDelete = async () => {
    if (!toDelete) return;
    await deleteBanner.mutateAsync(toDelete.id);
    setToDelete(null);
  };

  const heroCnt  = banners?.filter((b) => b.type === 'HERO').length ?? 0;
  const promoCnt = banners?.filter((b) => b.type === 'PROMO').length ?? 0;
  const activeCnt = banners?.filter((b) => b.isActive).length ?? 0;

  return (
    <Container fluid className="py-4">
      {/* Encabezado */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-0">Banners</h4>
          <p className="text-muted small mb-0">Gestioná los banners del slider principal y promos</p>
        </div>
        <Button variant="primary" onClick={openCreate} className="d-flex align-items-center gap-2">
          <Plus size={16} /> Nuevo banner
        </Button>
      </div>

      {/* Stats */}
      <Row className="g-3 mb-4">
        {[
          { label: 'Hero', value: heroCnt, color: '#0F4C81' },
          { label: 'Promo', value: promoCnt, color: '#D97706' },
          { label: 'Activos', value: activeCnt, color: '#16A34A' },
          { label: 'Total', value: banners?.length ?? 0, color: '#6B7280' },
        ].map((s) => (
          <Col key={s.label} xs={6} md={3}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body py-3">
                <div className="fw-bold fs-4" style={{ color: s.color }}>{s.value}</div>
                <div className="text-muted small">{s.label}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Filtros */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {(['', 'HERO', 'PROMO'] as const).map((t) => (
          <Button
            key={t || 'all'}
            size="sm"
            variant={typeFilter === t ? 'primary' : 'outline-secondary'}
            onClick={() => setTypeFilter(t)}
          >
            {t === '' ? 'Todos' : t}
          </Button>
        ))}
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="text-center py-5"><Spinner /></div>
      ) : isError ? (
        <Alert variant="danger">Error al cargar banners.</Alert>
      ) : !banners?.length ? (
        <div className="text-center py-5 text-muted">
          <Image size={40} className="mb-3 opacity-25" />
          <p>No hay banners. Creá el primero.</p>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <Table responsive hover className="mb-0" style={{ fontSize: '0.875rem' }}>
            <thead className="table-light">
              <tr>
                <th>Imagen</th>
                <th>Título / Subtítulo</th>
                <th>Tipo</th>
                <th className="text-center">Pos.</th>
                <th className="text-center">Estado</th>
                <th>Validez</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <BannerRow key={b.id} banner={b} onEdit={openEdit} onDelete={setToDelete} />
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Modal crear/editar */}
      {showModal && (
        <BannerModal
          show={showModal}
          onHide={() => setShowModal(false)}
          editing={editing}
        />
      )}

      {/* Modal confirmar eliminar */}
      <Modal show={!!toDelete} onHide={() => setToDelete(null)} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-6">Eliminar banner</Modal.Title>
        </Modal.Header>
        <Modal.Body className="small">
          ¿Eliminás el banner <strong>"{toDelete?.title}"</strong>? Esta acción no se puede deshacer.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={() => setToDelete(null)}>
            Cancelar
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleteBanner.isPending}>
            {deleteBanner.isPending ? <Spinner size="sm" /> : 'Eliminar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
