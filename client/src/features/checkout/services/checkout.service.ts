import api from '../../../shared/lib/api';
import type { CreateOrderDto, PaymentSession } from '../types/checkout.types';

export const checkoutService = {
  async createOrder(payload: CreateOrderDto) {
    const { data } = await api.post('/orders', payload);
    return data.data;
  },

  async initiatePayment(orderId: string): Promise<PaymentSession> {
    const { data } = await api.post<PaymentSession>('/payments/initiate', { orderId });
    return data;
  },
};
