import { useState } from 'react';
import {
  Container, Row, Col, Card, Badge, Button,
  Spinner, Alert, Form, Modal,
} from 'react-bootstrap';
import { RefreshCw, Link2, CheckCircle, ImageOff } from 'lucide-react';
import {
  useOrphanedImages,
  useAssignOrphanedImage,
  useAdminProducts,
} from '..';
import type { OrphanedImage, AdminProduct } from '..';

// ── Modal de asignación ──────────────────────────────────────────────────────

interface AssignModalProps {
  image: OrphanedImage;
  products: AdminProduct[];
  onHide: () => void;
  onAssigned: () => void;
}

function AssignModal({ image, products, onHide, onAssigned }: AssignModalProps) {
  const mutation = useAssignOrphanedImage();
  const [productId, setProductId] = useState('');
  const [alt, setAlt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) { setError('Selecciona un producto'); return; }
    setError(null);
    try {
      await mutation.mutateAsync({ url: image.url, productId, alt: alt || undefined });
      onAssigned();
      onHide();
    } catch {
      setError('No se pudo asignar la imagen. Intenta de nuevo.');
    }
  };

  return (
    <Modal show onHide={onHide} centered size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Asignar imagen a producto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

          <div className="text-center mb-4">
            <img
              src={image.url}
              alt="Imagen huérfana"
              className="rounded border"
              style={{ maxHeight: 200, maxWidth: '100%', objectFit: 'contain' }}
            />
            <p className="text-muted small mt-2 mb-0 text-break">{image.key}</p>
          </div>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-medium">Producto <span className="text-danger">*</span></Form.Label>
            <Form.Select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
            >
              <option value="">Seleccionar producto...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-medium">Texto alternativo (opcional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ej: Vista frontal del producto"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={mutation.isPending || !productId}
          >
            {mutation.isPending
              ? <><Spinner size="sm" animation="border" className="me-2" />Asignando...</>
              : <><Link2 size={15} className="me-2" />Asignar imagen</>}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function AdminOrphanedImagesPage() {
  const { data: orphaned = [], isLoading, isError, refetch, isFetching } = useOrphanedImages();
  const { data: productsResponse } = useAdminProducts({ limit: 200 });
  const products = productsResponse?.items ?? [];

  const [selecting, setSelecting] = useState<OrphanedImage | null>(null);
  const [assignedKeys, setAssignedKeys] = useState<Set<string>>(new Set());

  const pending = orphaned.filter((img) => !assignedKeys.has(img.key));
  const done = orphaned.filter((img) => assignedKeys.has(img.key));

  const handleAssigned = (key: string) => {
    setAssignedKeys((prev) => new Set([...prev, key]));
  };

  return (
    <Container fluid className="py-4">
      {/* Cabecera */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-1">Imágenes Huérfanas</h4>
          <p className="text-muted small mb-0">
            Archivos que existen en R2 pero no tienen ningún producto asignado
          </p>
        </div>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw size={14} className={`me-2 ${isFetching ? 'spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Estado de carga */}
      {isLoading && (
        <div className="text-center py-5 text-muted">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p className="mb-0">Consultando R2 y base de datos...</p>
        </div>
      )}

      {isError && (
        <Alert variant="danger">
          No se pudo obtener la lista de imágenes. Verifica la conexión con R2.
        </Alert>
      )}

      {!isLoading && !isError && (
        <>
          {/* Resumen */}
          <Row className="g-3 mb-4">
            <Col xs={6} md={3}>
              <Card className="border-0 bg-warning-subtle text-center py-3">
                <div className="fw-bold fs-3">{pending.length}</div>
                <div className="small text-muted">Sin asignar</div>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card className="border-0 bg-success-subtle text-center py-3">
                <div className="fw-bold fs-3">{done.length}</div>
                <div className="small text-muted">Asignadas esta sesión</div>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card className="border-0 bg-info-subtle text-center py-3">
                <div className="fw-bold fs-3">{orphaned.length}</div>
                <div className="small text-muted">Total en R2</div>
              </Card>
            </Col>
          </Row>

          {/* Sin imágenes */}
          {orphaned.length === 0 && (
            <div className="text-center py-5 text-muted">
              <ImageOff size={40} className="mb-3 opacity-50" />
              <p className="mb-0">No hay imágenes huérfanas. ¡Todo está asignado!</p>
            </div>
          )}

          {/* Grid de imágenes pendientes */}
          {pending.length > 0 && (
            <>
              <h6 className="fw-semibold text-muted mb-3 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                Sin asignar — {pending.length}
              </h6>
              <Row className="g-3 mb-5">
                {pending.map((img) => (
                  <Col key={img.key} xs={6} sm={4} md={3} lg={2}>
                    <Card className="h-100 border shadow-sm overflow-hidden">
                      <div
                        style={{ height: 130, overflow: 'hidden', background: '#f8f9fa', cursor: 'pointer' }}
                        onClick={() => setSelecting(img)}
                      >
                        <img
                          src={img.url}
                          alt={img.key}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      </div>
                      <Card.Body className="p-2">
                        <p
                          className="text-muted mb-2"
                          style={{ fontSize: '0.65rem', wordBreak: 'break-all', lineHeight: 1.3 }}
                        >
                          {img.key.replace('products/', '')}
                        </p>
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-100"
                          style={{ fontSize: '0.7rem' }}
                          onClick={() => setSelecting(img)}
                        >
                          <Link2 size={12} className="me-1" />
                          Asignar
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          )}

          {/* Grid de imágenes ya asignadas */}
          {done.length > 0 && (
            <>
              <h6 className="fw-semibold text-muted mb-3 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                Asignadas esta sesión — {done.length}
              </h6>
              <Row className="g-3">
                {done.map((img) => (
                  <Col key={img.key} xs={6} sm={4} md={3} lg={2}>
                    <Card className="h-100 border border-success overflow-hidden opacity-75">
                      <div style={{ height: 130, overflow: 'hidden', background: '#f8f9fa', position: 'relative' }}>
                        <img
                          src={img.url}
                          alt={img.key}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                        <div
                          className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                          style={{ background: 'rgba(25,135,84,0.25)' }}
                        >
                          <CheckCircle size={32} color="#198754" />
                        </div>
                      </div>
                      <Card.Body className="p-2">
                        <Badge bg="success" className="w-100" style={{ fontSize: '0.65rem' }}>Asignada</Badge>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          )}
        </>
      )}

      {/* Modal de asignación */}
      {selecting && (
        <AssignModal
          image={selecting}
          products={products}
          onHide={() => setSelecting(null)}
          onAssigned={() => handleAssigned(selecting.key)}
        />
      )}
    </Container>
  );
}
