import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/auth.types';

interface AuthStoreState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  /** true mientras AuthInit está resolviendo el refresh inicial */
  isInitializing: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  setAccessToken: (token: string) => void;
  setInitializing: (value: boolean) => void;
}

/**
 * Comprueba de forma síncrona (antes de que React renderice nada) si hay un
 * usuario persistido en localStorage.  Si lo hay, el store arranca con
 * isInitializing = true para que ProtectedRoute muestre un spinner mientras
 * AuthInit dispara el refresh.
 */
const hasPersistedUser = (() => {
  try {
    const raw = localStorage.getItem('auth-storage');
    return raw ? Boolean(JSON.parse(raw)?.state?.user) : false;
  } catch {
    return false;
  }
})();

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isInitializing: hasPersistedUser,

      setAuth: (user, accessToken) => {
        set({ user, accessToken, isAuthenticated: true, isInitializing: false });
      },

      clearAuth: () => {
        set({ user: null, accessToken: null, isAuthenticated: false, isInitializing: false });
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      setAccessToken: (token) => {
        set({ accessToken: token, isAuthenticated: true, isInitializing: false });
      },

      setInitializing: (value) => set({ isInitializing: value }),
    }),
    {
      name: 'auth-storage',
      // Solo persiste el usuario — el accessToken queda en memoria (no en localStorage)
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
