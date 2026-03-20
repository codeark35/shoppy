import { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Form, Button, Alert, Spinner, Badge, ListGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, MapPin, Package, Heart, Bell, BellOff,
  ChevronRight, ShieldCheck, LogOut, ShoppingCart, Trash2,
} from 'lucide-react';
import { AppNavbar } from '../shared/components/AppNavbar';
import { BottomNav } from '../shared/components/BottomNav';
import { AppFooter } from '../shared/components/AppFooter';
import { AddressManager } from '../features/account/components/AddressManager';
import { useProfile, useUpdateProfile, useChangePassword } from '../features/account/hooks/useAccount';
import { useAuthStore } from '../features/auth/store/authStore';
import { authService } from '../features/auth/services/auth.service';
import { useWishlist } from '../features/wishlist/hooks/useWishlist';
import { useCartStore } from '../features/cart/store/cartStore';
import { formatPrice } from '../shared/utils/formatPrice';
import { OrderList } from '../features/orders/components/OrderList';
import api from '../shared/lib/api';

type Section = 'perfil' | 'pedidos' | 'favoritos' | 'direcciones' | 'seguridad' | 'notificaciones';

const NAV_ITEMS: { key: Section; label: string; icon: React.ElementType; external?: boolean }[] = [
  { key: 'perfil',         label: 'Datos personales',    icon: User },
  { key: 'pedidos',        label: 'Mis pedidos',          icon: Package },
  { key: 'favoritos',      label: 'Mis favoritos',        icon: Heart },  
  { key: 'direcciones',    label: 'Mis direcciones',      icon: MapPin },
  { key: 'seguridad',      label: 'Contraseña y seg.',    icon: ShieldCheck },
  { key: 'notificaciones', label: 'Notificaciones',       icon: Bell },
];

export function AccountPage() {
  const [activeSection, setActiveSection] = useState<Section>('perfil');
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();
  const changePwdMutation = useChangePassword();
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const { items: wishlistItems, toggleWishlist, isPending: wishlistPending } = useWishlist();
  const { addItem } = useCartStore();

  const handleAddToCart = (item: (typeof wishlistItems)[number]) => {
    const variant = item.product.variants?.[0];
    const image = item.product.images?.[0];
    if (!variant) return;
    addItem({
      variantId: variant.id,
      sku: variant.sku,
      name: item.product.name,
      imageUrl: image?.url ?? null,
      price: Number(variant.price),
      quantity: 1,
      attributes: variant.attributes ?? {},
    });
  };

  // ─── Perfil ───────────────────────────────────────────────────────────────
  const [form, setForm] = useState({ name: '', phone: '' });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) setForm({ name: profile.name, phone: profile.phone ?? '' });
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    await updateMutation.mutateAsync(form);
    setSuccess(true);
  };

  // ─── Contraseña ───────────────────────────────────────────────────────────
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  const handlePwdChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPwdForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePwdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(false);
    if (pwdForm.newPassword !== pwdForm.confirm) {
      setPwdError('Las contraseñas nuevas no coinciden.');
      return;
    }
    try {
      await changePwdMutation.mutateAsync({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      setPwdSuccess(true);
      setPwdForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch {
      setPwdError('La contraseña actual es incorrecta.');
    }
  };

  // ─── Push notifications ───────────────────────────────────────────────────
  const [pushSupported] = useState(() => 'serviceWorker' in navigator && 'PushManager' in window);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    if (!pushSupported) return;
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setPushEnabled(!!sub)),
    );
  }, [pushSupported]);

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
        const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey });
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

  // ─── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignorar */ }
    clearAuth();
    navigate('/');
  };

  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const roleBadge = profile?.role === 'ADMIN'
    ? <Badge bg="danger" className="ms-2">Admin</Badge>
    : profile?.role === 'WAREHOUSE'
    ? <Badge bg="warning" text="dark" className="ms-2">Almacén</Badge>
    : null;

  return (
    <>
      <AppNavbar />
      <Container fluid="xl" className="py-4 pb-5 mb-4">
        <h1 className="fs-4 fw-bold mb-4">Mi cuenta</h1>

        {isLoading ? (
          <div className="text-center py-5"><Spinner /></div>
        ) : (
          <Row className="g-4 align-items-start">

            {/* ── Sidebar ─────────────────────────────────────────── */}
            <Col xs={12} md={3}>
              <Card className="shadow-sm account-sidebar">
                {/* Avatar + info */}
                <div className="account-sidebar__header text-center p-4">
                  <div className="account-avatar mx-auto mb-3">{initials}</div>
                  <div className="fw-bold">{profile?.name}{roleBadge}</div>
                  <div className="text-muted small mt-1">{profile?.email}</div>
                  {profile?.phone && (
                    <div className="text-muted small">{profile.phone}</div>
                  )}
                  <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: 4 }}>
                    {profile?.createdAt && (
                      <>Miembro desde {new Date(profile.createdAt).toLocaleDateString('es-PY', { year: 'numeric', month: 'long' })}</>
                    )}
                  </div>
                </div>

                {/* Navegación */}
                <ListGroup variant="flush" className="account-sidebar__nav">
                  {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
                    <ListGroup.Item
                      key={key}
                      action
                      active={activeSection === key}
                      onClick={() => setActiveSection(key)}
                      className="account-sidebar__item"
                    >
                      <Icon size={16} className="account-sidebar__icon" />
                      <span>{label}</span>
                      {activeSection === key && <ChevronRight size={14} className="ms-auto" />}
                    </ListGroup.Item>
                  ))}
                  <ListGroup.Item
                    action
                    onClick={handleLogout}
                    className="account-sidebar__item account-sidebar__item--danger"
                  >
                    <LogOut size={16} className="account-sidebar__icon" />
                    <span>Cerrar sesión</span>
                  </ListGroup.Item>
                </ListGroup>
              </Card>
            </Col>

            {/* ── Contenido principal ─────────────────────────────── */}
            <Col xs={12} md={9}>

              {/* PERFIL */}
              {activeSection === 'perfil' && (
                <Card className="shadow-sm">
                  <Card.Header className="bg-white border-bottom">
                    <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                      <User size={18} /> Datos personales
                    </h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    {success && (
                      <Alert variant="success" dismissible onClose={() => setSuccess(false)}>
                        Perfil actualizado correctamente.
                      </Alert>
                    )}
                    {updateMutation.isError && (
                      <Alert variant="danger">No se pudo actualizar el perfil.</Alert>
                    )}
                    <Form onSubmit={handleSubmit}>
                      <Row className="g-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Nombre completo</Form.Label>
                            <Form.Control name="name" value={form.name} onChange={handleChange} required />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Teléfono</Form.Label>
                            <Form.Control name="phone" value={form.phone} onChange={handleChange} placeholder="0981 123 456" />
                          </Form.Group>
                        </Col>
                        <Col xs={12}>
                          <Form.Group>
                            <Form.Label>Email</Form.Label>
                            <Form.Control value={profile?.email ?? ''} disabled />
                            <Form.Text className="text-muted">El email no puede modificarse.</Form.Text>
                          </Form.Group>
                        </Col>
                        <Col xs={12}>
                          <Form.Group>
                            <Form.Label>Rol</Form.Label>
                            <Form.Control value={profile?.role ?? ''} disabled />
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
              )}

              {/* PEDIDOS */}
              {activeSection === 'pedidos' && (
                <Card className="shadow-sm">
                  <Card.Header className="bg-white border-bottom d-flex align-items-center justify-content-between">
                    <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                      <Package size={18} /> Mis pedidos
                    </h5>
                    <Link to="/pedidos" className="btn btn-sm btn-outline-primary" style={{ borderRadius: 9999, fontSize: '0.8rem' }}>
                      Ver todos
                    </Link>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <OrderList />
                  </Card.Body>
                </Card>
              )}

              {/* FAVORITOS */}
              {activeSection === 'favoritos' && (
                <div>
                  <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                    <Heart size={18} className="text-danger" fill="currentColor" />
                    Mis favoritos
                    {wishlistItems.length > 0 && (
                      <span className="fs-6 fw-normal text-muted ms-1">({wishlistItems.length})</span>
                    )}
                  </h5>
                  {wishlistItems.length === 0 ? (
                    <div className="text-center py-5">
                      <Heart size={56} className="text-muted mb-3 opacity-25" />
                      <h6 className="text-muted fw-semibold mb-2">No tenés productos favoritos</h6>
                      <p className="text-muted small mb-4">Explorá el catálogo y guardá los productos que más te gusten.</p>
                      <Button as={Link as any} to="/productos" variant="primary">Ver catálogo</Button>
                    </div>
                  ) : (
                    <Row className="g-3">
                      {wishlistItems.map((item) => {
                        const image = item.product.images?.[0];
                        const variant = item.product.variants?.[0];
                        const price = variant ? Number(variant.price) : null;
                        return (
                          <Col key={item.id} xs={12} sm={6} xl={4}>
                            <Card className="h-100 shadow-sm border-0" style={{ borderRadius: 14 }}>
                              <Link to={`/productos/${item.product.slug}`} className="text-decoration-none">
                                <div style={{ aspectRatio: '1/1', background: '#F8FAFC', borderRadius: '14px 14px 0 0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {image
                                    ? <img src={image.url} alt={image.alt ?? item.product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 10 }} />
                                    : <Heart size={40} className="text-muted opacity-25" />}
                                </div>
                              </Link>
                              <Card.Body className="d-flex flex-column pb-2">
                                <Link to={`/productos/${item.product.slug}`} className="text-decoration-none text-dark">
                                  <p className="fw-semibold mb-1" style={{ fontSize: '0.88rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4, minHeight: '2.5em' }}>
                                    {item.product.name}
                                  </p>
                                </Link>
                                {price !== null && (
                                  <p className="fw-bold mb-2" style={{ color: '#0F4C81', fontSize: '1.05rem' }}>{formatPrice(price)}</p>
                                )}
                                <div className="d-flex gap-2 mt-auto">
                                  {variant ? (
                                    <Button size="sm" variant="accent" className="btn-accent flex-grow-1 d-flex align-items-center justify-content-center gap-1" style={{ borderRadius: 9999, fontSize: '0.8rem' }} onClick={() => handleAddToCart(item)}>
                                      <ShoppingCart size={14} /> Agregar
                                    </Button>
                                  ) : (
                                    <span className="flex-grow-1 text-center text-muted small" style={{ padding: '6px 0' }}>Sin stock</span>
                                  )}
                                  <Button size="sm" variant="outline-danger" style={{ borderRadius: 9999, width: 36, padding: 0 }} onClick={() => toggleWishlist(item.productId)} disabled={wishlistPending} title="Quitar de favoritos">
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  )}
                </div>
              )}

              {/* DIRECCIONES */}
              {activeSection === 'direcciones' && (
                <div>
                  <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <MapPin size={18} /> Mis direcciones
                  </h5>
                  <AddressManager />
                </div>
              )}

              {/* CONTRASEÑA */}
              {activeSection === 'seguridad' && (
                <Card className="shadow-sm">
                  <Card.Header className="bg-white border-bottom">
                    <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                      <ShieldCheck size={18} /> Contraseña y seguridad
                    </h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    {pwdSuccess && (
                      <Alert variant="success" dismissible onClose={() => setPwdSuccess(false)}>
                        Contraseña actualizada correctamente.
                      </Alert>
                    )}
                    {pwdError && (
                      <Alert variant="danger" dismissible onClose={() => setPwdError(null)}>
                        {pwdError}
                      </Alert>
                    )}
                    <Form onSubmit={handlePwdSubmit}>
                      <Row className="g-3">
                        <Col xs={12}>
                          <Form.Group>
                            <Form.Label>Contraseña actual</Form.Label>
                            <Form.Control
                              type="password"
                              name="currentPassword"
                              value={pwdForm.currentPassword}
                              onChange={handlePwdChange}
                              required
                              autoComplete="current-password"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Nueva contraseña</Form.Label>
                            <Form.Control
                              type="password"
                              name="newPassword"
                              value={pwdForm.newPassword}
                              onChange={handlePwdChange}
                              required
                              minLength={8}
                              autoComplete="new-password"
                            />
                            <Form.Text className="text-muted">Mínimo 8 caracteres.</Form.Text>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Confirmar nueva contraseña</Form.Label>
                            <Form.Control
                              type="password"
                              name="confirm"
                              value={pwdForm.confirm}
                              onChange={handlePwdChange}
                              required
                              minLength={8}
                              autoComplete="new-password"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <div className="mt-4">
                        <Button type="submit" variant="primary" disabled={changePwdMutation.isPending}>
                          {changePwdMutation.isPending ? <><Spinner size="sm" className="me-2" />Guardando…</> : 'Actualizar contraseña'}
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              )}

              {/* NOTIFICACIONES */}
              {activeSection === 'notificaciones' && (
                <Card className="shadow-sm">
                  <Card.Header className="bg-white border-bottom">
                    <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                      <Bell size={18} /> Notificaciones
                    </h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    {!pushSupported ? (
                      <Alert variant="info">Tu navegador no soporta notificaciones push.</Alert>
                    ) : (
                      <div className="d-flex align-items-center justify-content-between p-3 border rounded">
                        <div>
                          <div className="fw-semibold">Notificaciones push</div>
                          <div className="text-muted small mt-1">
                            {pushEnabled
                              ? 'Recibirás alertas de pedidos y promociones en tiempo real.'
                              : 'Activá las notificaciones para estar al tanto de tus pedidos.'}
                          </div>
                        </div>
                        <Button
                          variant={pushEnabled ? 'outline-danger' : 'outline-primary'}
                          size="sm"
                          onClick={handleTogglePush}
                          disabled={pushLoading}
                          className="d-flex align-items-center gap-2 ms-3"
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {pushLoading ? (
                            <Spinner size="sm" />
                          ) : pushEnabled ? (
                            <><BellOff size={16} /> Desactivar</>
                          ) : (
                            <><Bell size={16} /> Activar</>
                          )}
                        </Button>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}

            </Col>
          </Row>
        )}
      </Container>
      <AppFooter />
      <BottomNav />
    </>
  );
}

