import { Badge } from 'react-bootstrap';
import type { OrderStatus } from '../types/orders.types';
import { ORDER_STATUS_LABELS } from '../types/orders.types';

interface Props {
  status: OrderStatus;
}

const STATUS_ICONS: Record<OrderStatus, string> = {
  PENDING: '🕐',
  PAYMENT_PROCESSING: '💳',
  PAID: '✅',
  PREPARING: '📦',
  READY_TO_SHIP: '🔧',
  SHIPPED: '🚚',
  DELIVERED: '🏠',
  COMPLETED: '⭐',
  CANCELLED: '❌',
  REFUNDED: '↩️',
};

export function OrderTimeline({ status }: Props) {
  const STEPS: OrderStatus[] = [
    'PAID',
    'PREPARING',
    'READY_TO_SHIP',
    'SHIPPED',
    'DELIVERED',
    'COMPLETED',
  ];

  if (status === 'CANCELLED' || status === 'REFUNDED') {
    return (
      <div className="d-flex align-items-center gap-2 py-2">
        <Badge bg="danger" className="px-3 py-2 fs-6">
          {STATUS_ICONS[status]} {ORDER_STATUS_LABELS[status]}
        </Badge>
      </div>
    );
  }

  const activeIndex = STEPS.indexOf(status);

  return (
    <div className="position-relative py-2">
      {/* Línea horizontal */}
      <div
        className="position-absolute top-50 start-0 end-0 bg-light"
        style={{ height: 4, transform: 'translateY(-50%)', zIndex: 0 }}
      />
      <div
        className="position-absolute top-50 start-0 bg-primary"
        style={{
          height: 4,
          transform: 'translateY(-50%)',
          zIndex: 1,
          width: activeIndex >= 0 ? `${(activeIndex / (STEPS.length - 1)) * 100}%` : '0%',
          transition: 'width 0.5s ease',
        }}
      />
      <div className="d-flex justify-content-between position-relative" style={{ zIndex: 2 }}>
        {STEPS.map((step, idx) => {
          const isPast = activeIndex >= idx;
          const isActive = activeIndex === idx;
          return (
            <div key={step} className="d-flex flex-column align-items-center gap-1" style={{ minWidth: 60 }}>
              <div
                className={`d-flex align-items-center justify-content-center rounded-circle border-2 fw-bold ${
                  isActive
                    ? 'bg-primary text-white border-primary'
                    : isPast
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-muted border-secondary-subtle'
                }`}
                style={{ width: 36, height: 36, fontSize: 16, border: '2px solid' }}
              >
                {STATUS_ICONS[step]}
              </div>
              <span
                className={`text-center lh-1 ${isActive ? 'fw-bold text-primary' : isPast ? 'text-muted' : 'text-muted'}`}
                style={{ fontSize: '0.65rem', maxWidth: 60 }}
              >
                {ORDER_STATUS_LABELS[step]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
