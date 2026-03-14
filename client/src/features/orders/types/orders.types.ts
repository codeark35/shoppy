export type OrderStatus =
  | 'PENDING'
  | 'PAYMENT_PROCESSING'
  | 'PAID'
  | 'PREPARING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface OrderItem {
  id: string;
  variantId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  payment?: {
    status: string;
    confirmedAt?: string;
    amount: number;
  };
  shipping?: {
    trackingNumber?: string;
    city: string;
  };
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  PAYMENT_PROCESSING: 'Procesando pago',
  PAID: 'Pago confirmado',
  PREPARING: 'Preparando',
  READY_TO_SHIP: 'Listo para envío',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

export const ORDER_STATUS_VARIANT: Record<OrderStatus, string> = {
  PENDING: 'warning',
  PAYMENT_PROCESSING: 'info',
  PAID: 'success',
  PREPARING: 'primary',
  READY_TO_SHIP: 'primary',
  SHIPPED: 'primary',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  REFUNDED: 'secondary',
};
