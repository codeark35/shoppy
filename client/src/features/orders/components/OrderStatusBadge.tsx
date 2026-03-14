import { Badge } from 'react-bootstrap';
import type { OrderStatus } from '../types/orders.types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_VARIANT } from '../types/orders.types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <Badge bg={ORDER_STATUS_VARIANT[status]}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
