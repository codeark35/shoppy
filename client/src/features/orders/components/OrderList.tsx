import { ListGroup, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import { OrderStatusBadge } from './OrderStatusBadge';
import { formatPrice } from '../../../shared/utils/formatPrice';
import { formatDate } from '../../../shared/utils/formatDate';

export function OrderList() {
  const { data: orders, isLoading, isError } = useOrders();

  if (isLoading) return <Spinner animation="border" />;
  if (isError) return <Alert variant="danger">Error al cargar las órdenes.</Alert>;
  if (!orders?.length) return <p className="text-muted">No tenés órdenes aún.</p>;

  return (
    <ListGroup variant="flush">
      {orders.map((order) => (
        <ListGroup.Item
          key={order.id}
          as={Link}
          to={`/orders/${order.id}`}
          action
          className="d-flex justify-content-between align-items-center py-3"
        >
          <div>
            <div className="fw-semibold">Orden #{order.id.substring(0, 8).toUpperCase()}</div>
            <small className="text-muted">{formatDate(order.createdAt)}</small>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold">{formatPrice(order.total)}</span>
            <OrderStatusBadge status={order.status} />
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
}
