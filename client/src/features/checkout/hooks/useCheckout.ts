import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { checkoutService } from '../services/checkout.service';
import type { CreateOrderDto, ShippingAddress } from '../types/checkout.types';

export function useCheckout() {
  const [step, setStep] = useState<'address' | 'review' | 'payment'>('address');
  const [error, setError] = useState<string | null>(null);

  const createOrderMutation = useMutation({
    mutationFn: (dto: CreateOrderDto) => checkoutService.createOrder(dto),
  });

  const initiatePaymentMutation = useMutation({
    mutationFn: (orderId: string) => checkoutService.initiatePayment(orderId),
    onSuccess: (data) => {
      window.location.href = data.redirectUrl;
    },
  });

  const createOrderAndPay = async (dto: CreateOrderDto) => {
    setError(null);
    try {
      const order = await createOrderMutation.mutateAsync(dto);
      await initiatePaymentMutation.mutateAsync(order.id);
    } catch {
      setError('No se pudo procesar el pago. Intentá nuevamente.');
    }
  };

  const isLoading = createOrderMutation.isPending || initiatePaymentMutation.isPending;

  return {
    step,
    setStep,
    createOrder: createOrderMutation.mutateAsync,
    initiatePayment: initiatePaymentMutation.mutateAsync,
    createOrderAndPay,
    isCreatingOrder: createOrderMutation.isPending,
    isInitiatingPayment: initiatePaymentMutation.isPending,
    isLoading,
    error,
    createdOrder: createOrderMutation.data,
  };
}
