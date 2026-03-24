/**
 * MediaGalleryPicker
 * Modal reutilizable que muestra todas las imágenes del bucket R2
 * para seleccionar una o varias sin necesidad de re-subirlas.
 *
 * Uso (selección única):
 *   <MediaGalleryPicker show onHide={...} onSelect={(url) => setImageUrl(url)} />
 *
 * Uso (selección múltiple):
 *   <MediaGalleryPicker show multiple onHide={...} onSelect={(urls) => addImages(urls)} />
 */
import { useState, useMemo } from 'react';
import { Modal, Button, Form, Spinner, Badge, Alert, InputGroup } from 'react-bootstrap';
import { Search, CheckCircle, Images, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

interface GalleryItem {
  key: string;
  url: string;
  size: number;
  lastModified: string;
}

interface MediaGalleryPickerProps {
  show: boolean;
  onHide: () => void;
  /** Callback con la/s URL/s seleccionada/s */
  onSelect: (urls: string[]) => void;
  /** Si true, permite marcar varias imágenes antes de confirmar */
  multiple?: boolean;
  title?: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaGalleryPicker({
  show,
  onHide,
  onSelect,
  multiple = false,
  title,
}: MediaGalleryPickerProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: items = [], isLoading, isError, refetch, isFetching } = useQuery<GalleryItem[]>({
    queryKey: ['media', 'gallery'],
    queryFn: () => api.get<GalleryItem[]>('/media/gallery').then((r) => r.data),
    enabled: show,
    staleTime: 30 * 1000,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((img) => img.key.toLowerCase().includes(q));
  }, [items, search]);

  const toggle = (url: string) => {
    if (!multiple) {
      // Selección única: confirmar inmediatamente
      onSelect([url]);
      handleHide();
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const handleConfirm = () => {
    if (selected.size > 0) {
      onSelect([...selected]);
      handleHide();
    }
  };

  const handleHide = () => {
    setSelected(new Set());
    setSearch('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleHide} size="xl" centered scrollable>
      <Modal.Header closeButton className="border-bottom pb-3">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Images size={18} className="text-primary" />
          <Modal.Title className="fs-6 fw-bold mb-0">
            {title ?? (multiple ? 'Seleccionar imágenes de la galería' : 'Seleccionar imagen de la galería')}
          </Modal.Title>
          {multiple && selected.size > 0 && (
            <Badge bg="primary">{selected.size} seleccionada{selected.size > 1 ? 's' : ''}</Badge>
          )}
        </div>
      </Modal.Header>

      <Modal.Body style={{ minHeight: 300 }}>
        {/* Barra de búsqueda */}
        <div className="d-flex align-items-center gap-2 mb-3">
          <InputGroup size="sm" className="flex-grow-1">
            <InputGroup.Text><Search size={13} /></InputGroup.Text>
            <Form.Control
              placeholder="Buscar por nombre de archivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <Button variant="outline-secondary" onClick={() => setSearch('')}>
                <X size={13} />
              </Button>
            )}
          </InputGroup>
          <Button variant="outline-secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Spinner size="sm" /> : `${items.length} archivos`}
          </Button>
        </div>

        {/* Estados */}
        {isLoading && (
          <div className="text-center py-5 text-muted">
            <Spinner animation="border" variant="primary" size="sm" className="me-2" />
            Cargando galería desde R2...
          </div>
        )}

        {isError && (
          <Alert variant="danger" className="py-2 small">
            No se pudo cargar la galería. Verifica la conexión con R2.
          </Alert>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="text-center py-5 text-muted small">
            {search ? 'Sin resultados para esa búsqueda.' : 'No hay imágenes en el bucket.'}
          </div>
        )}

        {/* Grid */}
        {!isLoading && filtered.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {filtered.map((img) => {
              const isSelected = selected.has(img.url);
              const filename = img.key.replace(/^[^/]+\//, ''); // quitar carpeta
              return (
                <div
                  key={img.key}
                  onClick={() => toggle(img.url)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: isSelected ? '2.5px solid #0d6efd' : '1.5px solid #dee2e6',
                    background: '#f8f9fa',
                    position: 'relative',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxShadow: isSelected ? '0 0 0 3px rgba(13,110,253,0.2)' : undefined,
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ height: 110, overflow: 'hidden' }}>
                    <img
                      src={img.url}
                      alt={img.key}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Check icon cuando está seleccionada */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        background: '#0d6efd', borderRadius: '50%',
                        width: 22, height: 22,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <CheckCircle size={14} color="#fff" />
                    </div>
                  )}

                  {/* Info */}
                  <div style={{ padding: '4px 6px 6px' }}>
                    <p
                      style={{
                        fontSize: '0.62rem', color: '#6c757d', margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                      title={img.key}
                    >
                      {filename}
                    </p>
                    <p style={{ fontSize: '0.6rem', color: '#adb5bd', margin: 0 }}>
                      {formatBytes(img.size)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal.Body>

      {/* Footer solo en modo múltiple */}
      {multiple && (
        <Modal.Footer className="border-top">
          <Button variant="light" size="sm" onClick={handleHide}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={selected.size === 0}
            onClick={handleConfirm}
          >
            Agregar {selected.size > 0 ? `${selected.size} imagen${selected.size > 1 ? 'es' : ''}` : 'imágenes'}
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
}
