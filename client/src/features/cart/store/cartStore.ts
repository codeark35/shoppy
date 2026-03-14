import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../../../shared/lib/api';
import type { Cart, CartItem } from '../types/cart.types';

interface CartStoreState {
  cart: Cart;
  isOpen: boolean;
  isSyncing: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  updateItem: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  mergeCart: () => Promise<void>;
  syncWithServer: () => Promise<void>;
}

const emptyCart: Cart = { items: [], total: 0, itemCount: 0 };

function recalculate(items: CartItem[]): Cart {
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  return { items, total: Math.round(total * 100) / 100, itemCount };
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      cart: emptyCart,
      isOpen: false,
      isSyncing: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      // ─── Operaciones optimistas (local-first) ──────────────────────────────
      addItem: (item) => {
        const { cart } = get();
        const existing = cart.items.find((i) => i.variantId === item.variantId);
        let newItems: CartItem[];

        if (existing) {
          newItems = cart.items.map((i) =>
            i.variantId === item.variantId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i,
          );
        } else {
          newItems = [...cart.items, item];
        }

        set({ cart: recalculate(newItems), isOpen: true });

        // Sincronizar con servidor en background
        const isAuthenticated = !!localStorage.getItem('access_token');
        const endpoint = isAuthenticated ? '/cart/user/items' : '/cart/items';
        api.post(endpoint, { variantId: item.variantId, quantity: item.quantity }).catch(console.error);
      },

      updateItem: (variantId, quantity) => {
        const { cart } = get();
        let newItems: CartItem[];

        if (quantity === 0) {
          newItems = cart.items.filter((i) => i.variantId !== variantId);
        } else {
          newItems = cart.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i,
          );
        }

        set({ cart: recalculate(newItems) });

        const isAuthenticated = !!localStorage.getItem('access_token');
        const endpoint = isAuthenticated
          ? `/cart/user/items/${variantId}`
          : `/cart/items/${variantId}`;
        api.patch(endpoint, { quantity }).catch(console.error);
      },

      removeItem: (variantId) => {
        const { cart } = get();
        const newItems = cart.items.filter((i) => i.variantId !== variantId);
        set({ cart: recalculate(newItems) });

        const isAuthenticated = !!localStorage.getItem('access_token');
        const endpoint = isAuthenticated
          ? `/cart/user/items/${variantId}`
          : `/cart/items/${variantId}`;
        api.delete(endpoint).catch(console.error);
      },

      clearCart: () => set({ cart: emptyCart }),

      // ─── Merge post-login ──────────────────────────────────────────────────
      mergeCart: async () => {
        try {
          const { data } = await api.post<Cart>('/cart/merge');
          set({ cart: data });
        } catch {
          // Silencioso — si falla el merge, el usuario no pierde nada
        }
      },

      // ─── Sync completo desde servidor ──────────────────────────────────────
      syncWithServer: async () => {
        set({ isSyncing: true });
        try {
          const isAuthenticated = !!localStorage.getItem('access_token');
          const endpoint = isAuthenticated ? '/cart/user' : '/cart';
          const { data } = await api.get<Cart>(endpoint);
          set({ cart: data });
        } catch {
          // Mantener estado local si falla
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ cart: state.cart }),
    },
  ),
);
