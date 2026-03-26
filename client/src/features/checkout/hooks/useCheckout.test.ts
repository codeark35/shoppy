import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCheckout } from './useCheckout';
import { checkoutService } from '../services/checkout.service';
import { createQueryWrapper } from '../../../test/utils';
import type { CreateOrderDto } from '../types/checkout.types';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../services/checkout.service', () => ({
  checkoutService: {
    createOrder: vi.fn(),
    initiatePayment: vi.fn(),
  },
}));

// window.location no se puede asignar en jsdom directamente — mockeamos el objeto
const mockAssign = vi.fn();
Object.defineProperty(window, 'location', {
  value: { href: '', assign: mockAssign },
  writable: true,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockDto: CreateOrderDto = {
  shippingAddress: {
    addressLabel: 'Casa',
    street: 'Av. España 1234',
    city: 'Asunción',
    department: 'Capital',
    country: 'PY',
    recipientName: 'Juan Pérez',
    phone: '0981123456',
  },
};

const mockOrder = { id: 'order-123', orderNumber: 'ORD-001' };
const mockPaymentSession = {
  orderId: 'order-123',
  shopProcessId: 'shop-1',
  processId: 'proc-1',
  redirectUrl: 'https://payment.example.com/pay/abc',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = '';
  });

  describe('estado inicial', () => {
    it('arranca en el paso address', () => {
      const { result } = renderHook(() => useCheckout(), { wrapper: createQueryWrapper() });

      expect(result.current.step).toBe('address');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('setStep()', () => {
    it('permite cambiar el paso manualmente', () => {
      const { result } = renderHook(() => useCheckout(), { wrapper: createQueryWrapper() });

      act(() => {
        result.current.setStep('review');
      });

      expect(result.current.step).toBe('review');
    });
  });

  describe('createOrderAndPay()', () => {
    it('crea la orden y redirige al gateway de pago', async () => {
      vi.mocked(checkoutService.createOrder).mockResolvedValue(mockOrder);
      vi.mocked(checkoutService.initiatePayment).mockResolvedValue(mockPaymentSession);

      const { result } = renderHook(() => useCheckout(), { wrapper: createQueryWrapper() });

      await act(async () => {
        await result.current.createOrderAndPay(mockDto);
      });

      expect(checkoutService.createOrder).toHaveBeenCalledWith(mockDto);
      expect(checkoutService.initiatePayment).toHaveBeenCalledWith('order-123');
      expect(window.location.href).toBe('https://payment.example.com/pay/abc');
    });

    it('muestra error si la creación de la orden falla', async () => {
      vi.mocked(checkoutService.createOrder).mockRejectedValue(new Error('Server error'));

      const { result } = renderHook(() => useCheckout(), { wrapper: createQueryWrapper() });

      await act(async () => {
        await result.current.createOrderAndPay(mockDto);
      });

      expect(result.current.error).toBe('No se pudo procesar el pago. Intentá nuevamente.');
      expect(checkoutService.initiatePayment).not.toHaveBeenCalled();
    });

    it('muestra error si el pago falla después de crear la orden', async () => {
      vi.mocked(checkoutService.createOrder).mockResolvedValue(mockOrder);
      vi.mocked(checkoutService.initiatePayment).mockRejectedValue(new Error('Payment gateway error'));

      const { result } = renderHook(() => useCheckout(), { wrapper: createQueryWrapper() });

      await act(async () => {
        await result.current.createOrderAndPay(mockDto);
      });

      expect(result.current.error).toBe('No se pudo procesar el pago. Intentá nuevamente.');
    });

    it('limpia el error previo antes de un nuevo intento', async () => {
      // Primer intento falla
      vi.mocked(checkoutService.createOrder).mockRejectedValueOnce(new Error('fail'));
      const { result } = renderHook(() => useCheckout(), { wrapper: createQueryWrapper() });

      await act(async () => {
        await result.current.createOrderAndPay(mockDto);
      });
      expect(result.current.error).not.toBeNull();

      // Segundo intento exitoso
      vi.mocked(checkoutService.createOrder).mockResolvedValue(mockOrder);
      vi.mocked(checkoutService.initiatePayment).mockResolvedValue(mockPaymentSession);

      await act(async () => {
        await result.current.createOrderAndPay(mockDto);
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('isLoading', () => {
    it('isLoading y isCreatingOrder son false en estado idle', () => {
      const { result } = renderHook(() => useCheckout(), { wrapper: createQueryWrapper() });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isCreatingOrder).toBe(false);
      expect(result.current.isInitiatingPayment).toBe(false);
    });

    it('isLoading combina isCreatingOrder e isInitiatingPayment', async () => {
      vi.mocked(checkoutService.createOrder).mockResolvedValue(mockOrder);
      vi.mocked(checkoutService.initiatePayment).mockResolvedValue(mockPaymentSession);

      const { result } = renderHook(() => useCheckout(), { wrapper: createQueryWrapper() });

      // Tras completar, ambos deben ser false
      await act(async () => {
        await result.current.createOrderAndPay(mockDto);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
