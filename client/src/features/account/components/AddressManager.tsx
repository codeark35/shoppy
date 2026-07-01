import { useState, useMemo } from 'react';
import { Card, Button, ListGroup, Badge, Modal, Form, Col, Row, Spinner, Alert } from 'react-bootstrap';
import { Plus, Trash2, MapPin, Pencil, Star } from 'lucide-react';
import { DEPARTMENTS, getCitiesByDepartment } from '../../../shared/data/paraguay';
import type { Address, CreateAddressDto, UpdateAddressDto } from '../types/account.types';
import { useAddresses, useCreateAddress, useDeleteAddress, useUpdateAddress, useSetDefaultAddress } from '../hooks/useAccount';

const EMPTY_CREATE: CreateAddressDto = {
  label: '', street: '', city: '', department: '', zipCode: '', isDefault: false,
};

export function AddressManager() {
  const { data: addresses, isLoading } = useAddresses();
  const createMutation = useCreateAddress();
  const updateMutation = useUpdateAddress();
  const deleteMutation = useDeleteAddress();
  const defaultMutation = useSetDefaultAddress();

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAddressDto>(EMPTY_CREATE);

  const [editTarget, setEditTarget] = useState<Address | null>(null);
  const [editForm, setEditForm] = useState<UpdateAddressDto>({});

  const createCities = useMemo(() => getCitiesByDepartment(createForm.department), [createForm.department]);
  const editCities = useMemo(() => getCitiesByDepartment(editForm.department ?? ''), [editForm.department]);

  const handleCreateChange = (e: React.ChangeEvent<any>) => {
    const val = e.target instanceof HTMLInputElement && e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setCreateForm((prev) => ({ ...prev, [e.target.name]: val }));
  };

  const handleCreateDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCreateForm((prev) => ({ ...prev, department: e.target.value, city: '' }));
  };

  const handleEditChange = (e: React.ChangeEvent<any>) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEditForm((prev) => ({ ...prev, department: e.target.value, city: '' }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync(createForm);
    setShowCreate(false);
    setCreateForm(EMPTY_CREATE);
  };

  const openEdit = (addr: Address) => {
    setEditTarget(addr);
    setEditForm({ label: addr.label, street: addr.street, city: addr.city, department: addr.department, zipCode: addr.zipCode ?? '' });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    await updateMutation.mutateAsync({ id: editTarget.id, dto: editForm });
    setEditTarget(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta dirección?')) deleteMutation.mutate(id);
  };

  const handleSetDefault = (id: string) => defaultMutation.mutate(id);

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center bg-white">
          <span className="fw-semibold">Mis direcciones</span>
          <Button size="sm" variant="primary" onClick={() => setShowCreate(true)}>
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
                <ListGroup.Item key={addr.id} className="py-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="fw-semibold d-flex align-items-center gap-2 mb-1">
                        {addr.label}
                        {addr.isDefault && <Badge bg="primary" pill>Principal</Badge>}
                      </div>
                      <small className="text-muted">
                        {addr.street}, {addr.city}, {addr.department}
                        {addr.zipCode ? ` (${addr.zipCode})` : ''}
                      </small>
                    </div>
                    <div className="d-flex align-items-center gap-1 ms-2">
                      {!addr.isDefault && (
                        <Button
                          variant="link"
                          className="text-warning p-1"
                          title="Marcar como principal"
                          onClick={() => handleSetDefault(addr.id)}
                          disabled={defaultMutation.isPending}
                        >
                          <Star size={15} />
                        </Button>
                      )}
                      <Button
                        variant="link"
                        className="text-primary p-1"
                        title="Editar"
                        onClick={() => openEdit(addr)}
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="link"
                        className="text-danger p-1"
                        title="Eliminar"
                        onClick={() => handleDelete(addr.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      {/* Modal nueva dirección */}
      <Modal show={showCreate} onHide={() => setShowCreate(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Nueva dirección</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreate}>
          <Modal.Body>
            {createMutation.isError && <Alert variant="danger">No se pudo guardar la dirección.</Alert>}
            <Row className="g-3">
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Etiqueta (ej. Casa, Trabajo)</Form.Label>
                  <Form.Control name="label" value={createForm.label} onChange={handleCreateChange} required placeholder="Casa" />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Calle y número</Form.Label>
                  <Form.Control name="street" value={createForm.street} onChange={handleCreateChange} required placeholder="Av. España 1234" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Departamento</Form.Label>
                  <Form.Select name="department" value={createForm.department} onChange={handleCreateDeptChange} required>
                    <option value="">Seleccioná un departamento</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Ciudad</Form.Label>
                  <Form.Select name="city" value={createForm.city} onChange={handleCreateChange} required disabled={!createForm.department}>
                    <option value="">
                      {createForm.department ? 'Seleccioná una ciudad' : 'Primero seleccioná un departamento'}
                    </option>
                    {createCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Código postal (opcional)</Form.Label>
                  <Form.Control name="zipCode" value={createForm.zipCode} onChange={handleCreateChange} />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Check
                  type="checkbox"
                  name="isDefault"
                  id="isDefault"
                  label="Establecer como dirección principal"
                  checked={!!createForm.isDefault}
                  onChange={handleCreateChange}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Spinner size="sm" /> : 'Guardar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal editar dirección */}
      <Modal show={!!editTarget} onHide={() => setEditTarget(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar dirección</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEdit}>
          <Modal.Body>
            {updateMutation.isError && <Alert variant="danger">No se pudo actualizar la dirección.</Alert>}
            <Row className="g-3">
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Etiqueta</Form.Label>
                  <Form.Control name="label" value={editForm.label ?? ''} onChange={handleEditChange} required />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Calle y número</Form.Label>
                  <Form.Control name="street" value={editForm.street ?? ''} onChange={handleEditChange} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Departamento</Form.Label>
                  <Form.Select name="department" value={editForm.department ?? ''} onChange={handleEditDeptChange} required>
                    <option value="">Seleccioná un departamento</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Ciudad</Form.Label>
                  <Form.Select name="city" value={editForm.city ?? ''} onChange={handleEditChange} required disabled={!editForm.department}>
                    <option value="">
                      {editForm.department ? 'Seleccioná una ciudad' : 'Primero seleccioná un departamento'}
                    </option>
                    {editCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Código postal (opcional)</Form.Label>
                  <Form.Control name="zipCode" value={editForm.zipCode ?? ''} onChange={handleEditChange} />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Spinner size="sm" /> : 'Actualizar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
