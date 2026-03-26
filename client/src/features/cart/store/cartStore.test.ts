import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCartStore } from './cartStore';
import api from '../../../shared/lib/api';
import type { Cart, CartItem } from '../types/cart.types';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../../shared/lib/api', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    get: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const emptyCart: Cart = { items: [], total: 0, itemCount: 0 };

const mockItem: CartItem = {
  variantId: 'v-1',
  name: 'Camiseta Azul',
  sku: 'CAM-AZUL-M',
  price: 50000,
  quantity: 1,
  imageUrl: null,
  attributes: { color: 'Azul', talla: 'M' },
};

function resetStore() {
  useCartStore.setState({
    cart: emptyCart,
    isOpen: false,
    isSyncing: false,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('cartStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  // ── Estado inicial ──────────────────────────────────────────────────────────

  describe('estado inicial', () => {
    it('arranca con carrito vacío', () => {
      const { cart } = useCartStore.getState();
      expect(cart.items).toHaveLength(0);
      expect(cart.total).toBe(0);
      expect(cart.itemCount).toBe(0);
    });
  });

  // ── openCart / closeCart ────────────────────────────────────────────────────

  describe('openCart() / closeCart()', () => {
    it('abre y cierra el drawer del carrito', () => {
      const state = useCartStore.getState();

      state.openCart();
      expect(useCartStore.getState().isOpen).toBe(true);

      state.closeCart();
      expect(useCartStore.getState().isOpen).toBe(false);
    });
  });

  // ── addItem ─────────────────────────────────────────────────────────────────

  describe('addItem()', () => {
    it('agrega un item nuevo al carrito', () => {
      useCartStore.getState().addItem(mockItem);

      const { cart } = useCartStore.getState();
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].variantId).toBe('v-1');
      expect(cart.itemCount).toBe(1);
      expect(cart.total).toBe(50000);
    });

    it('incrementa la cantidad si el item ya existe', () => {
      useCartStore.getState().addItem(mockItem);
      useCartStore.getState().addItem({ ...mockItem, quantity: 2 });

      const { cart } = useCartStore.getState();
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(3);
      expect(cart.itemCount).toBe(3);
      expect(cart.total).toBe(150000);
    });

    it('abre el carrito automáticamente al agregar', () => {
      useCartStore.getState().addItem(mockItem);
      expect(useCartStore.getState().isOpen).toBe(true);
    });

    it('agrega múltiples items distintos', () => {
      const secondItem: CartItem = { ...mockItem, variantId: 'v-2', name: 'Pantalón Rojo', price: 80000 };

      useCartStore.getState().addItem(mockItem);
      useCartStore.getState().addItem(secondItem);

      const { cart } = useCartStore.getState();
      expect(cart.items).toHaveLength(2);
      expect(cart.total).toBe(130000);
    });
  });

  // ── updateItem ──────────────────────────────────────────────────────────────

  describe('updateItem()', () => {
    it('actualiza la cantidad de un item existente', () => {
      useCartStore.getState().addItem(mockItem);
      useCartStore.getState().updateItem('v-1', 5);

      const { cart } = useCartStore.getState();
      expect(cart.items[0].quantity).toBe(5);
      expect(cart.itemCount).toBe(5);
      expect(cart.total).toBe(250000);
    });

    it('elimina el item si la cantidad es 0', () => {
      useCartStore.getState().addItem(mockItem);
      useCartStore.getState().updateItem('v-1', 0);

      expect(useCartStore.getState().cart.items).toHaveLength(0);
    });
  });

  // ── removeItem ──────────────────────────────────────────────────────────────

  describe('removeItem()', () => {
    it('elimina un item del carrito', () => {
      useCartStore.getState().addItem(mockItem);
      useCartStore.getState().removeItem('v-1');

      const { cart } = useCartStore.getState();
      expect(cart.items).toHaveLength(0);
      expect(cart.total).toBe(0);
    });

    it('no afecta otros items al eliminar uno', () => {
      const second: CartItem = { ...mockItem, variantId: 'v-2', price: 30000 };
      useCartStore.getState().addItem(mockItem);
      useCartStore.getState().addItem(second);
      useCartStore.getState().removeItem('v-1');

      const { cart } = useCartStore.getState();
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].variantId).toBe('v-2');
    });
  });

  // ── clearCart ───────────────────────────────────────────────────────────────

  describe('clearCart()', () => {
    it('vacía todo el carrito', () => {
      useCartStore.getState().addItem(mockItem);
      useCartStore.getState().addItem({ ...mockItem, variantId: 'v-2' });
      useCartStore.getState().clearCart();

      const { cart } = useCartStore.getState();
      expect(cart.items).toHaveLength(0);
      expect(cart.total).toBe(0);
      expect(cart.itemCount).toBe(0);
    });
  });

  // ── mergeCart ───────────────────────────────────────────────────────────────

  describe('mergeCart()', () => {
    it('actualiza el carrito con la respuesta del servidor', async () => {
      const serverCart: Cart = {
        items: [{ ...mockItem, quantity: 3 }],
        total: 150000,
        itemCount: 3,
      };
      vi.mocked(api.post).mockResolvedValueOnce({ data: serverCart });

      await useCartStore.getState().mergeCart();

      const { cart } = useCartStore.getState();
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(3);
      expect(cart.total).toBe(150000);
    });

    it('mantiene el estado local si el merge falla', async () => {
      useCartStore.getState().addItem(mockItem);
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Network error'));

      await useCartStore.getState().mergeCart();

      // El estado local debe mantenerse intacto
      expect(useCartStore.getState().cart.items).toHaveLength(1);
    });
  });

  // ── Cálculo de totales ──────────────────────────────────────────────────────

  describe('cálculo de totales', () => {
    it('redondea el total a 2 decimales', () => {
      const precisionItem: CartItem = { ...mockItem, price: 33333, quantity: 3 };
      useCartStore.getState().addItem(precisionItem);

      expect(useCartStore.getState().cart.total).toBe(99999);
    });

    it('calcula itemCount como suma de cantidades, no conteo de items', () => {
      useCartStore.getState().addItem({ ...mockItem, quantity: 3 });
      useCartStore.getState().addItem({ ...mockItem, variantId: 'v-2', quantity: 2 });

      expect(useCartStore.getState().cart.itemCount).toBe(5);
    });
  });
});
