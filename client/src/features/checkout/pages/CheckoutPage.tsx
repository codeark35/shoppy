import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Truck, Zap, MapPin, MessageCircle } from 'lucide-react';
import { AppNavbar } from '../../../shared/components/AppNavbar';
import { BottomNav } from '../../../shared/components/BottomNav';
import { AppFooter } from '../../../shared/components/AppFooter';
import { useCartStore } from '../../cart/store/cartStore';
import { useCheckout } from '../hooks/useCheckout';
import { useCartPricing } from '../../cart/hooks/useCartPricing';
import { formatPrice } from '../../../shared/utils/formatPrice';
import api from '../../../shared/lib/api';
import { analyticsTracker } from '../../analytics/services/analytics.tracker';
import { DEPARTMENTS, getCitiesByDepartment } from '../../../shared/data/paraguay';
import type { CreateOrderDto } from '../types/checkout.types';
import type { Address } from '../../account/types/account.types';
import { useProfile, useAddresses } from '../../account/hooks/useAccount';
import { useVariantImages } from '../../cart/hooks/useVariantImages';

interface ShippingRate {
  id: string;
  name: string;
  price: number | string;
  estimatedDays: number;
  zoneName: string;
}

function CartItemImage({ src, alt }: { src: string | null; alt: string }) {
  const [errored, setErrored] = useState(false);
  const containerStyle: React.CSSProperties = {
    width: 52, height: 52, flexShrink: 0,
    borderRadius: 6, border: '1px solid #e9ecef',
    overflow: 'hidden', background: '#f8f9fa',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  if (!src || errored) {
    return (
      <div style={containerStyle}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#adb5bd" strokeWidth="1.5" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="m21 15-5-5L5 21"/>
        </svg>
      </div>
    );
  }
  return (
    <div style={containerStyle}>
      <img
        src={src}
        alt={alt}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={() => setErrored(true)}
      />
    </div>
  );
}

export function CheckoutPage() {
  const { cart } = useCartStore();
  const { items, total } = cart;
  const navigate = useNavigate();
  const location = useLocation();
  const { createOrderAndPay, isLoading, error } = useCheckout();
  const { data: profile } = useProfile();
  const { data: addresses } = useAddresses();

  // Cupón y pricing pasados desde CartPage via router state
  const couponCode = (location.state as any)?.couponCode as string | undefined;

  const { data: pricing } = useCartPricing(items, couponCode);
  const { data: variantImages } = useVariantImages(items.map((i) => i.variantId));
  const autoDiscount = pricing?.automaticDiscount ?? 0;
  const couponDiscount = pricing?.couponDiscount ?? 0;

  const [form, setForm] = useState({
    street: '',
    city: '',
    department: '',
    zipCode: '',
    country: 'PY',
    recipientName: '',
    phone: '',
    notes: '',
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [whatsappError, setWhatsappError] = useState(false);

  const applyAddress = (addr: Address) => {
    setSelectedAddressId(addr.id);
    setForm((prev) => ({
      ...prev,
      street: addr.street,
      city: addr.city,
      department: addr.department,
      zipCode: addr.zipCode ?? '',
    }));
  };

  useEffect(() => { analyticsTracker.trackCheckoutStart(); }, []);

  // Pre-fill nombre y teléfono desde el perfil del usuario
  useEffect(() => {
    if (!profile) return;
    setForm((prev) => ({
      ...prev,
      ...(!prev.recipientName && profile.name ? { recipientName: profile.name } : {}),
      ...(!prev.phone && profile.phone ? { phone: profile.phone } : {}),
    }));
  }, [profile]);

  // Pre-fill con la dirección guardada por defecto (solo al montar)
  useEffect(() => {
    if (!addresses || (addresses as Address[]).length === 0) return;
    const def = (addresses as Address[]).find((a) => a.isDefault) ?? (addresses as Address[])[0];
    applyAddress(def);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses]);

  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<string>('');
  const [loadingRates, setLoadingRates] = useState(false);

  // Cargar tarifas cuando el departamento se complete
  useEffect(() => {
    if (!form.department.trim()) {
      setShippingRates([]);
      setSelectedRate('');
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingRates(true);
      try {
        const res = await api.get<ShippingRate[]>(`/shipping/rates?department=${form.department.trim()}`);
        setShippingRates(res.data);
        setSelectedRate('');
      } catch {
        setShippingRates([]);
      } finally {
        setLoadingRates(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.department]);

  const selectedRateObj = shippingRates.find((r) => r.id === selectedRate);
  const shippingCost = selectedRateObj ? Number(selectedRateObj.price) : 0;
  const finalTotal = (pricing?.subtotalAfter ?? total - couponDiscount) + shippingCost;

  if (items.length === 0) {
    navigate('/carrito');
    return null;
  }

  const buildWhatsAppMessage = () => {
    const lines = [
      '¡Hola! Me gustaría hacer el siguiente pedido:',
      '',
      '*Productos:*',
      ...items.map((i) => `  • ${i.name} × ${i.quantity} — ${formatPrice(i.price * i.quantity)}`),
      '',
      ...(autoDiscount > 0 ? [`💸 Descuento automático: -${formatPrice(autoDiscount)}`] : []),
      ...(couponDiscount > 0 ? [`🎟️ Cupón (${couponCode}): -${formatPrice(couponDiscount)}`] : []),
      `💰 *Total:* ${formatPrice(finalTotal)}`,
      '',
      '*Dirección de envío:*',
      `👤 ${form.recipientName}`,
      `📍 ${form.street}, ${form.city}, ${form.department}`,
      `📞 ${form.phone}`,
      ...(form.notes ? ['', `📝 Notas: ${form.notes}`] : []),
    ];
    return encodeURIComponent(lines.join('\n'));
  };

  const handleWhatsApp = () => {
    setWhatsappError(false);
    if (!form.recipientName || !form.street || !form.city || !form.department || !form.phone) {
      setWhatsappError(true);
      return;
    }
    const raw = import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined;
    const number = raw?.replace(/[^0-9]/g, '');
    if (!number) return;
    window.open(`https://wa.me/${number}?text=${buildWhatsAppMessage()}`, '_blank');
  };

  const cities = useMemo(() => getCitiesByDepartment(form.department), [form.department]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, department: e.target.value, city: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dto: CreateOrderDto = {
      shippingAddress: {
        street: form.street,
        city: form.city,
        department: form.department,
        zipCode: form.zipCode || undefined,
        country: form.country,
        recipientName: form.recipientName,
        phone: form.phone,
        addressLabel: `${form.recipientName} — ${form.street}`,
      },
      notes: form.notes || undefined,
      couponCode,
      shippingRateId: selectedRate || undefined,
    };
    await createOrderAndPay(dto);
  };

  return (
    <>
      <AppNavbar />
      <Container className="py-4">
        <h1 className="fs-3 fw-bold mb-4">Checkout</h1>
        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
        <Row>
          <Col md={7}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h5 className="fw-bold mb-3">Dirección de envío</h5>
                {addresses && (addresses as Address[]).length > 0 && (
                  <div className="mb-3">
                    <p className="small text-muted mb-2 d-flex align-items-center gap-1">
                      <MapPin size={13} /> Tus direcciones guardadas
                    </p>
                    <div className="d-flex flex-wrap gap-2">
                      {(addresses as Address[]).map((addr) => (
                        <button
                          key={addr.id}
                          type="button"
                          className={`btn btn-sm ${selectedAddressId === addr.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => applyAddress(addr)}
                        >
                          {addr.isDefault && '⭐ '}{addr.label || addr.street}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <Form onSubmit={handleSubmit} id="checkout-form">
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Nombre del destinatario</Form.Label>
                        <Form.Control
                          name="recipientName"
                          value={form.recipientName}
                          onChange={handleChange}
                          required
                          placeholder="Juan Pérez"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Teléfono</Form.Label>
                        <Form.Control
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          required
                          placeholder="0981 123 456"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label>Calle / Dirección</Form.Label>
                        <Form.Control
                          name="street"
                          value={form.street}
                          onChange={handleChange}
                          required
                          placeholder="Av. Mcal. López 1234"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Departamento</Form.Label>
                        <Form.Select
                          name="department"
                          value={form.department}
                          onChange={handleDepartmentChange}
                          required
                        >
                          <option value="">Seleccioná un departamento</option>
                          {DEPARTMENTS.map((d) => (
                            <option key={d.name} value={d.name}>{d.name}</option>
                          ))}
                        </Form.Select>
                        <Form.Text className="text-muted small">{DEPARTMENTS.find(d => d.name === form.department) ? '' : 'Seleccioná un departamento'}</Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Ciudad</Form.Label>
                        <Form.Select
                          name="city"
                          value={form.city}
                          onChange={handleSelectChange}
                          required
                          disabled={!form.department}
                        >
                          <option value="">
                            {form.department ? 'Seleccioná una ciudad' : 'Primero seleccioná un departamento'}
                          </option>
                          {cities.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label>Notas adicionales (opcional)</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          name="notes"
                          value={form.notes}
                          onChange={handleChange}
                          placeholder="Referencias, instrucciones de entrega…"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>

            {/* ShippingSelector */}
            {form.department.trim() && (
              <Card className="shadow-sm mb-4">
                <Card.Body>
                  <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <Truck size={18} /> Opción de envío
                  </h5>
                  {loadingRates ? (
                    <Spinner animation="border" size="sm" />
                  ) : shippingRates.length === 0 ? (
                    <p className="text-muted small mb-0">No hay tarifas disponibles para {form.department}.</p>
                  ) : (
                    shippingRates.map((rate) => (
                      <div
                        key={rate.id}
                        className={`shipping-option${selectedRate === rate.id ? ' active' : ''}`}
                        onClick={() => setSelectedRate(rate.id)}
                        role="radio"
                        aria-checked={selectedRate === rate.id}
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedRate(rate.id)}
                      >
                        <div>
                          <p className="mb-0 fw-semibold">{rate.name}</p>
                          <small className="text-muted">{rate.estimatedDays} días hábiles · {rate.zoneName}</small>
                        </div>
                        <span className="fw-bold">{formatPrice(rate.price)}</span>
                      </div>
                    ))
                  )}
                </Card.Body>
              </Card>
            )}
          </Col>
          <Col md={5}>
            <Card className="shadow-sm">
              <Card.Body>
                <h5 className="fw-bold mb-3">Tu pedido</h5>
                {items.map((item) => {
                  const appliedItem = pricing?.appliedItems?.find(
                    (a) => a.variantId === item.variantId
                  );
                  const attrEntries = Object.entries(item.attributes ?? {});
                  return (
                    <div key={item.variantId} className="d-flex gap-2 mb-3">
                      <CartItemImage
                        src={variantImages?.[item.variantId] ?? item.imageUrl}
                        alt={item.name}
                      />
                      <div className="flex-grow-1 small" style={{ minWidth: 0 }}>
                        <div className="fw-semibold text-truncate" title={item.name}>
                          {item.name}
                        </div>
                        {attrEntries.length > 0 && (
                          <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                            {attrEntries.map(([k, v]) => `${k}: ${v}`).join(' · ')}
                          </div>
                        )}
                        <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                          {item.quantity > 1
                            ? `${formatPrice(item.price)} c/u × ${item.quantity}`
                            : `× ${item.quantity}`}
                        </div>
                        {appliedItem && (
                          <div className="text-success" style={{ fontSize: '0.78rem' }}>
                            🏷 {appliedItem.promotionName} − {formatPrice(appliedItem.discount)}
                          </div>
                        )}
                      </div>
                      <div className="fw-semibold small text-end" style={{ whiteSpace: 'nowrap' }}>
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  );
                })}
                <hr className="my-2" />
                <div className="d-flex justify-content-between mb-1 small text-muted">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                {autoDiscount > 0 && (
                  <div className="d-flex justify-content-between mb-1 small text-success">
                    <span className="d-flex align-items-center gap-1">
                      <Zap size={11} /> Descuentos aplicados
                    </span>
                    <span>− {formatPrice(autoDiscount)}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="d-flex justify-content-between mb-1 small text-success">
                    <span>Descuento ({couponCode})</span>
                    <span>− {formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between mb-2 small text-muted">
                  <span>Envío</span>
                  <span>{selectedRateObj ? formatPrice(shippingCost) : 'A seleccionar'}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between fw-bold fs-5 mb-4">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(finalTotal)}</span>
                </div>
                {whatsappError && (
                  <Alert variant="warning" className="py-2 small mb-3">
                    Completá todos los campos de dirección antes de pedir por WhatsApp.
                  </Alert>
                )}
                <Button
                  form="checkout-form"
                  type="submit"
                  className="w-100 btn-accent"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Spinner size="sm" className="me-2" />Procesando…</>
                  ) : (
                    'Pagar con Bancard'
                  )}
                </Button>
                <div className="d-flex align-items-center gap-2 my-2">
                  <div className="flex-grow-1" style={{ borderBottom: '1px solid #dee2e6' }} />
                  <small className="text-muted px-1">o</small>
                  <div className="flex-grow-1" style={{ borderBottom: '1px solid #dee2e6' }} />
                </div>
                <Button
                  type="button"
                  className="w-100 d-flex align-items-center justify-content-center gap-2"
                  size="lg"
                  style={{ background: '#25D366', border: 'none', color: '#fff' }}
                  onClick={handleWhatsApp}
                  disabled={isLoading}
                >
                  <MessageCircle size={20} />
                  Pedir por WhatsApp
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <AppFooter />
      <BottomNav />
    </>
  );
}
