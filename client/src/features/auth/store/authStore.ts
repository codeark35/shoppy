import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/auth.types';

interface AuthStoreState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  setAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) => {
        // Token solo en memoria — NO se escribe en localStorage directamente
        set({ user, accessToken, isAuthenticated: true });
      },

      clearAuth: () => {
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      // Actualiza solo el token (usado por el interceptor de auto-refresh)
      setAccessToken: (token) => {
        set({ accessToken: token, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
      // Solo persiste el usuario — el accessToken queda en memoria (no en localStorage)
      // Esto evita que el token quede expuesto a scripts XSS
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
