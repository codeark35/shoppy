// Payloads de eventos del módulo orders
// Usado por inventory, notifications y otros módulos sin acoplamiento directo

export class OrderPaidEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly items: Array<{
      variantId: string;
      quantity: number;
      name: string;
      price: number;
    }>,
    public readonly total: number,
  ) {}
}

export class OrderStatusChangedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly previousStatus: string,
    public readonly newStatus: string,
  ) {}
}

export const ORDER_EVENTS = {
  PAID: 'order.paid',
  STATUS_CHANGED: 'order.status.changed',
  CANCELLED: 'order.cancelled',
} as const;
