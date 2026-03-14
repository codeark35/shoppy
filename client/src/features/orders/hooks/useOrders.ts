import { useQuery } from '@tanstack/react-query';
import { ordersService } from '../services/orders.service';

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersService.getMyOrders(),
  });
}

export function useOrderDetail(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersService.getOrderById(id),
    enabled: !!id,
  });
}
