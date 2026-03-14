import api from '../../../shared/lib/api';
import type { Order } from '../types/orders.types';

export const ordersService = {
  async getMyOrders(): Promise<Order[]> {
    const { data } = await api.get<Order[]>('/orders');
    return data;
  },

  async getOrderById(id: string): Promise<Order> {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return data;
  },
};
