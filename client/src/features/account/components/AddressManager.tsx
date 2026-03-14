import { useState } from 'react';
import { Card, Button, ListGroup, Badge, Modal, Form, Col, Row, Spinner, Alert } from 'react-bootstrap';
import { Plus, Trash2, MapPin } from 'lucide-react';
import type { Address, CreateAddressDto } from '../types/account.types';
import { useAddresses, useCreateAddress, useDeleteAddress } from '../hooks/useAccount';

const EMPTY_FORM: CreateAddressDto = {
  label: '',
  street: '',
  city: '',
  department: '',
  zipCode: '',
  isDefault: false,
};

export function AddressManager() {
  const { data: addresses, isLoading } = useAddresses();
  const createMutation = useCreateAddress();
  const deleteMutation = useDeleteAddress();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateAddressDto>(EMPTY_FORM);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync(form);
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta dirección?')) deleteMutation.mutate(id);
  };

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center bg-white">
          <span className="fw-semibold">Mis direcciones</span>
          <Button size="sm" variant="primary" onClick={() => setShowModal(true)}>
            <Plus size={16} className="me-1" />
            Agregar
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="text-center py-4"><Spinner size="sm" /></div>
          ) : !addresses?.length ? (
            <div className="text-center py-4 text-muted">
              <MapPin size={32} className="mb-2 opacity-50" />
              <p className="mb-0">No tenés direcciones guardadas</p>
            </div>
          ) : (
            <ListGroup variant="flush">
              {addresses.map((addr: Address) => (
                <ListGroup.Item key={addr.id} className="d-flex justify-content-between align-items-start py-3">
                  <div>
                    <div className="fw-semibold d-flex align-items-center gap-2">
                      {addr.label}
                      {addr.isDefault && <Badge bg="primary" pill>Principal</Badge>}
                    </div>
                    <small className="text-muted">
                      {addr.street}, {addr.city}, {addr.department}
                      {addr.zipCode ? ` (${addr.zipCode})` : ''}
                    </small>
                  </div>
                  <Button
                    variant="link"
                    className="text-danger p-0 ms-3"
                    onClick={() => handleDelete(addr.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={16} />
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      {/* Modal nueva dirección */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Nueva dirección</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {createMutation.isError && (
              <Alert variant="danger">No se pudo guardar la dirección.</Alert>
            )}
            <Row className="g-3">
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Etiqueta (ej. Casa, Trabajo)</Form.Label>
                  <Form.Control name="label" value={form.label} onChange={handleChange} required placeholder="Casa" />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Calle y número</Form.Label>
                  <Form.Control name="street" value={form.street} onChange={handleChange} required placeholder="Av. España 1234" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Ciudad</Form.Label>
                  <Form.Control name="city" value={form.city} onChange={handleChange} required placeholder="Asunción" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Departamento</Form.Label>
                  <Form.Control name="department" value={form.department} onChange={handleChange} required placeholder="Central" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Código postal (opcional)</Form.Label>
                  <Form.Control name="zipCode" value={form.zipCode} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Check
                  type="checkbox"
                  name="isDefault"
                  id="isDefault"
                  label="Establecer como dirección principal"
                  checked={!!form.isDefault}
                  onChange={handleChange}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Spinner size="sm" /> : 'Guardar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
