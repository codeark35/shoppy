import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { Bell, BellOff } from 'lucide-react';
import { AppNavbar } from '../shared/components/AppNavbar';
import { BottomNav } from '../shared/components/BottomNav';
import { AddressManager } from '../features/account/components/AddressManager';
import { useProfile, useUpdateProfile } from '../features/account/hooks/useAccount';
import { useAuthStore } from '../features/auth/store/authStore';
import api from '../shared/lib/api';

export function AccountPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();
  const [form, setForm] = useState({ name: profile?.name ?? '', phone: profile?.phone ?? '' });
  const [success, setSuccess] = useState(false);

  // ─── Push notifications ───────────────────────────────────────────────────
  const [pushSupported] = useState(() => 'serviceWorker' in navigator && 'PushManager' in window);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const handleTogglePush = async () => {
    if (!pushSupported) return;
    setPushLoading(true);
    try {
      if (pushEnabled) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await api.delete('/notifications/push/unsubscribe', { data: { endpoint: sub.endpoint } });
          await sub.unsubscribe();
        }
        setPushEnabled(false);
      } else {
        const reg = await navigator.serviceWorker.ready;
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey,
        });
        const json = sub.toJSON();
        await api.post('/notifications/push/subscribe', {
          endpoint: sub.endpoint,
          p256dh: (json.keys as any)?.p256dh ?? '',
          auth: (json.keys as any)?.auth ?? '',
        });
        setPushEnabled(true);
      }
    } catch (err) {
      console.error('Error al gestionar notificaciones push:', err);
    } finally {
      setPushLoading(false);
    }
  };

  // Verificar estado actual de suscripción al montar
  useEffect(() => {
    if (!pushSupported) return;
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setPushEnabled(!!sub)),
    );
  }, [pushSupported]);

  useEffect(() => {
    if (!isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    await updateMutation.mutateAsync(form);
    setSuccess(true);
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <AppNavbar />
      <Container className="py-4 pb-5 mb-4">
        <h1 className="fs-3 fw-bold mb-4">Mi cuenta</h1>
        {isLoading ? (
          <div className="text-center py-5"><Spinner /></div>
        ) : (
          <Row className="g-4">
            <Col md={4}>
              <Card className="shadow-sm text-center p-4 mb-3">
                <div
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3 fs-2 fw-bold"
                  style={{ width: 80, height: 80 }}
                >
                  {profile?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <h5 className="fw-bold mb-1">{profile?.name}</h5>
                <p className="text-muted small mb-2">{profile?.email}</p>
                {profile?.role === 'ADMIN' && <Badge bg="danger">Administrador</Badge>}
                {profile?.role === 'WAREHOUSE' && <Badge bg="warning">Almacén</Badge>}
              </Card>
              <AddressManager />
            </Col>
            <Col md={8}>
              <Card className="shadow-sm">
                <Card.Body>
                  <h5 className="fw-bold mb-3">Datos personales</h5>
                  {success && (
                    <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
                      Perfil actualizado correctamente.
                    </Alert>
                  )}
                  {updateMutation.isError && (
                    <Alert variant="danger">No se pudo actualizar el perfil.</Alert>
                  )}
                  <Form onSubmit={handleSubmit}>
                    <Row className="g-3">
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label>Nombre completo</Form.Label>
                          <Form.Control name="name" value={form.name} onChange={handleChange} required />
                        </Form.Group>
                      </Col>
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label>Email</Form.Label>
                          <Form.Control value={profile?.email ?? ''} disabled />
                        </Form.Group>
                      </Col>
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label>Teléfono</Form.Label>
                          <Form.Control name="phone" value={form.phone} onChange={handleChange} placeholder="0981 123 456" />
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="mt-4">
                      <Button type="submit" variant="primary" disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? <><Spinner size="sm" className="me-2" />Guardando…</> : 'Guardar cambios'}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>

              {/* Sección: Notificaciones push */}
              {pushSupported && (
                <Card className="shadow-sm mt-3">
                  <Card.Body className="d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="fw-bold mb-1">Notificaciones</h6>
                      <p className="text-muted small mb-0">
                        {pushEnabled
                          ? 'Recibirás notificaciones de tus pedidos y promociones.'
                          : 'Activá las notificaciones para estar al tanto de tus pedidos.'}
                      </p>
                    </div>
                    <Button
                      variant={pushEnabled ? 'outline-danger' : 'outline-primary'}
                      size="sm"
                      onClick={handleTogglePush}
                      disabled={pushLoading}
                      className="d-flex align-items-center gap-2 ms-3"
                    >
                      {pushLoading ? (
                        <Spinner size="sm" />
                      ) : pushEnabled ? (
                        <><BellOff size={16} /> Desactivar</>
                      ) : (
                        <><Bell size={16} /> Activar</>
                      )}
                    </Button>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        )}
      </Container>
      <BottomNav />
    </>
  );
}
