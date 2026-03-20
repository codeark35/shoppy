import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Truck, Zap } from 'lucide-react';
import { AppNavbar } from '../shared/components/AppNavbar';
import { BottomNav } from '../shared/components/BottomNav';
import { AppFooter } from '../shared/components/AppFooter';
import { useCartStore } from '../features/cart/store/cartStore';
import { useCheckout } from '../features/checkout/hooks/useCheckout';
import { useCartPricing } from '../features/cart/hooks/useCartPricing';
import { formatPrice } from '../shared/utils/formatPrice';
import api from '../shared/lib/api';
import { analyticsTracker } from '../features/analytics/services/analytics.tracker';
import type { CreateOrderDto } from '../features/checkout/types/checkout.types';

interface ShippingRate {
  id: string;
  name: string;
  price: number | string;
  estimatedDays: number;
  zoneName: string;
}

export function CheckoutPage() {
  const { cart } = useCartStore();
  const { items, total } = cart;
  const navigate = useNavigate();
  const location = useLocation();
  const { createOrderAndPay, isLoading, error } = useCheckout();

  // Cupón y pricing pasados desde CartPage via router state
  const couponCode = (location.state as any)?.couponCode as string | undefined;

  const { data: pricing } = useCartPricing(items, couponCode);
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

  useEffect(() => { analyticsTracker.trackCheckoutStart(); }, []);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
                        <Form.Label>Ciudad</Form.Label>
                        <Form.Control
                          name="city"
                          value={form.city}
                          onChange={handleChange}
                          required
                          placeholder="Asunción"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Departamento</Form.Label>
                        <Form.Control
                          name="department"
                          value={form.department}
                          onChange={handleChange}
                          required
                          placeholder="Central"
                        />
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
                {items.map((item) => (
                  <div key={item.variantId} className="d-flex justify-content-between mb-2 small">
                    <span>{item.name} × {item.quantity}</span>
                    <span className="fw-semibold">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <hr />
                <div className="d-flex justify-content-between mb-1 small text-muted">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                {autoDiscount > 0 && (
                  <div className="d-flex justify-content-between mb-1 small text-success">
                    <span className="d-flex align-items-center gap-1">
                      <Zap size={11} /> Descuentos automáticos
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
