import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Spinner, Alert } from 'react-bootstrap';
import { ArrowLeft, MapPin, CreditCard } from 'lucide-react';
import { useOrderDetail } from '../hooks/useOrders';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderTimeline } from './OrderTimeline';
import { formatPrice } from '../../../shared/utils/formatPrice';
import { formatDate } from '../../../shared/utils/formatDate';

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError } = useOrderDetail(id ?? '');

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (isError || !order) {
    return (
      <Container className="py-5">
        <Alert variant="danger">No se pudo cargar el pedido.</Alert>
        <Link to="/pedidos" className="btn btn-outline-secondary btn-sm">
          <ArrowLeft size={14} className="me-1" />
          Volver a mis pedidos
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center gap-3 mb-4">
        <Link to="/pedidos" className="btn btn-outline-secondary btn-sm">
          <ArrowLeft size={14} />
        </Link>
        <div>
          <h1 className="fs-4 fw-bold mb-0">
            Pedido #{order.id.substring(0, 8).toUpperCase()}
          </h1>
          <small className="text-muted">{formatDate(order.createdAt)}</small>
        </div>
        <div className="ms-auto">
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Timeline de estados */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <h6 className="fw-bold mb-3">Estado del pedido</h6>
          <OrderTimeline status={order.status} />
        </Card.Body>
      </Card>

      <Row className="g-4">
        <Col md={8}>
          {/* Productos */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="fw-semibold bg-white">Productos</Card.Header>
            <Table responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Producto</th>
                  <th className="text-center">Cantidad</th>
                  <th className="text-end">Precio</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="fw-semibold">{item.name}</span>
                    </td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-end">{formatPrice(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light">
                <tr>
                  <td colSpan={2} className="text-end fw-bold">Total</td>
                  <td className="text-end fw-bold text-primary">{formatPrice(order.total)}</td>
                </tr>
              </tfoot>
            </Table>
          </Card>
        </Col>

        <Col md={4}>
          {/* Envío */}
          {order.shipping && (
            <Card className="shadow-sm mb-3">
              <Card.Body>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <MapPin size={16} className="text-primary" />
                  <span className="fw-semibold">Dirección de entrega</span>
                </div>
                <p className="text-muted small mb-1">{order.shipping.city}</p>
                {order.shipping.trackingNumber && (
                  <p className="text-muted small mb-0">
                    <strong>Seguimiento:</strong> {order.shipping.trackingNumber}
                  </p>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Pago */}
          {order.payment && (
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <CreditCard size={16} className="text-primary" />
                  <span className="fw-semibold">Pago</span>
                </div>
                <p className="text-muted small mb-1">
                  Estado: <strong>{order.payment.status}</strong>
                </p>
                {order.payment.confirmedAt && (
                  <p className="text-muted small mb-0">
                    Confirmado: {formatDate(order.payment.confirmedAt)}
                  </p>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
}
