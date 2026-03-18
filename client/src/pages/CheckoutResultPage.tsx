import { useSearchParams, Link } from 'react-router-dom';
import { Container, Card, Spinner, Alert } from 'react-bootstrap';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { AppNavbar } from '../shared/components/AppNavbar';
import { BottomNav } from '../shared/components/BottomNav';
import { AppFooter } from '../shared/components/AppFooter';
import { useOrderDetail } from '../features/orders/hooks/useOrders';

export function CheckoutResultPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order');
  const { data: order, isLoading } = useOrderDetail(orderId ?? '');

  const renderContent = () => {
    if (!orderId) {
      return (
        <Alert variant="warning">No se especificó un pedido. <Link to="/">Volver al inicio</Link>.</Alert>
      );
    }

    if (isLoading) {
      return (
        <div className="text-center py-4">
          <Spinner className="mb-3" />
          <p className="text-muted">Verificando estado del pago…</p>
        </div>
      );
    }

    if (!order) {
      return <Alert variant="danger">No se pudo encontrar el pedido.</Alert>;
    }

    if (order.status === 'PAID' || order.status === 'PAYMENT_PROCESSING') {
      return (
        <div className="text-center py-4">
          <CheckCircle size={64} className="text-success mb-3" />
          <h2 className="fw-bold">¡Pago exitoso!</h2>
          <p className="text-muted mb-1">Tu pedido #{order.orderNumber} fue confirmado.</p>
          <p className="text-muted mb-4">Te enviaremos actualizaciones sobre el estado de tu entrega.</p>
          <div className="d-flex gap-3 justify-content-center">
            <Link to="/pedidos" className="btn btn-primary">Ver mis pedidos</Link>
            <Link to="/productos" className="btn btn-outline-secondary">Seguir comprando</Link>
          </div>
        </div>
      );
    }

    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      return (
        <div className="text-center py-4">
          <XCircle size={64} className="text-danger mb-3" />
          <h2 className="fw-bold">Pago no completado</h2>
          <p className="text-muted mb-4">El pago para el pedido #{order.orderNumber} no pudo procesarse.</p>
          <div className="d-flex gap-3 justify-content-center">
            <Link to="/carrito" className="btn btn-primary">Volver al carrito</Link>
            <Link to="/pedidos" className="btn btn-primary">Ver mis pedidos</Link>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-4">
        <Clock size={64} className="text-warning mb-3" />
        <h2 className="fw-bold">Pago en proceso</h2>
        <p className="text-muted mb-4">Estamos procesando tu pago para el pedido #{order.orderNumber}. Te notificaremos cuando esté confirmado.</p>
        <Link to="/pedidos" className="btn btn-primary">Ver mis pedidos</Link>
      </div>
    );
  };

  return (
    <>
      <AppNavbar />
      <Container className="py-5 d-flex justify-content-center">
        <Card className="shadow-sm" style={{ maxWidth: 520, width: '100%' }}>
          <Card.Body className="p-4">
            {renderContent()}
          </Card.Body>
        </Card>
      </Container>
      <AppFooter />
      <BottomNav />
    </>
  );
}
