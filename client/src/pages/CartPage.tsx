import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card, Table, Image, Alert, InputGroup, Form, Spinner } from 'react-bootstrap';
import { Trash2, ShoppingCart, Tag, CheckCircle, Zap } from 'lucide-react';
import { AppNavbar } from '../shared/components/AppNavbar';
import { BottomNav } from '../shared/components/BottomNav';
import { AppFooter } from '../shared/components/AppFooter';
import { useCartStore } from '../features/cart/store/cartStore';
import { useAuthStore } from '../features/auth/store/authStore';
import { useCartPricing } from '../features/cart/hooks/useCartPricing';
import { formatPrice } from '../shared/utils/formatPrice';

export function CartPage() {
  const { cart, removeItem, updateItem } = useCartStore();
  const { items, total, itemCount } = cart;
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | undefined>(undefined);

  const {
    data: pricing,
    isLoading: pricingLoading,
    isError: pricingError,
    error: pricingErrorData,
  } = useCartPricing(items, appliedCouponCode);

  const autoDiscount = pricing?.automaticDiscount ?? 0;
  const couponDiscount = pricing?.couponDiscount ?? 0;
  const finalTotal = pricing?.subtotalAfter ?? total;

  const couponErrorMsg = pricingError && appliedCouponCode
    ? ((pricingErrorData as any)?.response?.data?.message ?? 'Cupón no válido')
    : '';

  const handleApplyCoupon = () => {
    const code = couponCode.trim();
    if (code) setAppliedCouponCode(code);
  };

  const handleRemoveCoupon = () => {
    setAppliedCouponCode(undefined);
    setCouponCode('');
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/checkout?login=1');
    } else {
      navigate('/checkout', { state: { couponCode: appliedCouponCode } });
    }
  };

  if (items.length === 0) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5 text-center">
          <ShoppingCart size={64} className="text-muted mb-4" />
          <h2>Tu carrito está vacío</h2>
          <p className="text-muted mb-4">Explorá nuestro catálogo y agregá productos.</p>
          <Link to="/productos" className="btn btn-primary">
            Ver productos
          </Link>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppNavbar />
      <Container className="py-4">
        <h1 className="fs-3 fw-bold mb-4">
          Carrito <span className="text-muted fs-5">({itemCount} {itemCount === 1 ? 'producto' : 'productos'})</span>
        </h1>
        <Row>
          <Col md={8}>
            <Card className="shadow-sm mb-3">
              <Table responsive className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Producto</th>
                    <th className="text-center">Cantidad</th>
                    <th className="text-end">Precio</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.variantId}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          {item.imageUrl ? (
                            <Image src={item.imageUrl} alt={item.name} width={56} height={56} rounded className="object-fit-cover" />
                          ) : (
                            <div className="bg-light rounded" style={{ width: 56, height: 56 }} />
                          )}
                          <div>
                            <p className="mb-0 fw-semibold">{item.name}</p>
                            {item.attributes && Object.keys(item.attributes).length > 0 && (
                              <small className="text-muted">{Object.values(item.attributes).join(' / ')}</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-center align-middle">
                        <div className="d-flex align-items-center justify-content-center gap-2">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => updateItem(item.variantId, item.quantity - 1)}
                          >
                            −
                          </Button>
                          <span className="fw-semibold px-1">{item.quantity}</span>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => updateItem(item.variantId, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </td>
                      <td className="text-end align-middle fw-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </td>
                      <td className="text-center align-middle">
                        <Button
                          variant="link"
                          className="text-danger p-0"
                          onClick={() => removeItem(item.variantId)}
                          aria-label="Eliminar"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <h5 className="fw-bold mb-3">Resumen</h5>

                {/* Cupón */}
                <div className="coupon-input-group mb-3">
                  <InputGroup>
                    <InputGroup.Text><Tag size={16} /></InputGroup.Text>
                    <Form.Control
                      placeholder="Código de cupón"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      disabled={!!appliedCouponCode}
                    />
                    {appliedCouponCode ? (
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={handleRemoveCoupon}
                      >
                        Quitar
                      </Button>
                    ) : (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={handleApplyCoupon}
                        disabled={pricingLoading || !couponCode.trim()}
                      >
                        {pricingLoading ? <Spinner size="sm" /> : 'Aplicar'}
                      </Button>
                    )}
                  </InputGroup>
                  {couponErrorMsg && <p className="text-danger small mt-1">{couponErrorMsg}</p>}
                  {appliedCouponCode && !pricingError && pricing?.appliedCouponCode && (
                    <p className="text-success small mt-1">
                      <CheckCircle size={14} className="me-1" />
                      Cupón <strong>{pricing.appliedCouponCode}</strong> aplicado — ahorrás {formatPrice(couponDiscount)}
                    </p>
                  )}
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                {autoDiscount > 0 && (
                  <div className="d-flex justify-content-between mb-2 text-success">
                    <span className="d-flex align-items-center gap-1">
                      <Zap size={13} /> Descuentos automáticos
                    </span>
                    <span>− {formatPrice(autoDiscount)}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="d-flex justify-content-between mb-2 text-success">
                    <span>Descuento ({pricing?.appliedCouponCode})</span>
                    <span>− {formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Envío</span>
                  <span className="text-success">A calcular</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between fw-bold fs-5 mb-4">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(finalTotal)}</span>
                </div>
                <Button variant="accent" className="w-100 btn-accent" size="lg" onClick={handleCheckout}>
                  Finalizar compra
                </Button>
                {!isAuthenticated && (
                  <Alert variant="info" className="mt-3 mb-0 small">
                    Deberás iniciar sesión para completar la compra.
                  </Alert>
                )}
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
