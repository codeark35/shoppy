export interface ShippingAddress {
  addressLabel: string;
  street: string;
  city: string;
  department: string;
  zipCode?: string;
  country: string;
  recipientName: string;
  phone: string;
}

export interface CreateOrderDto {
  shippingAddress: ShippingAddress;
  notes?: string;
  couponCode?: string;
  shippingRateId?: string;
}

/** @deprecated use CreateOrderDto */
export type CreateOrderPayload = CreateOrderDto;

export interface InitiatePaymentPayload {
  orderId: string;
}

export interface PaymentSession {
  orderId: string;
  shopProcessId: string;
  processId: string;
  redirectUrl: string;
}
