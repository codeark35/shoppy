import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth.service';
import { createQueryWrapper } from '../../../test/utils';
import type { User } from '../types/auth.types';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
  },
}));

// Firebase no disponible en tests
vi.mock('../../../shared/lib/firebase', () => ({
  firebaseAuth: {},
  googleProvider: {},
}));

vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
}));

// cartStore.mergeCart no debe hacer nada en tests
vi.mock('../../cart/store/cartStore', () => ({
  useCartStore: () => ({ mergeCart: vi.fn().mockResolvedValue(undefined) }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'CUSTOMER',
  createdAt: new Date().toISOString(),
};

const mockAuthResponse = { user: mockUser, accessToken: 'token-abc123' };

function resetAuthStore() {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isInitializing: false,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAuth', () => {
  beforeEach(() => {
    resetAuthStore();
    vi.clearAllMocks();
  });

  describe('estado inicial', () => {
    it('devuelve usuario null y no autenticado por defecto', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createQueryWrapper() });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoggingIn).toBe(false);
    });
  });

  describe('login()', () => {
    it('almacena el usuario y token tras un login exitoso', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth(), { wrapper: createQueryWrapper() });

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: '123456' });
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('llama a authService.login con las credenciales correctas', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth(), { wrapper: createQueryWrapper() });
      const payload = { email: 'test@example.com', password: 'secret' };

      await act(async () => {
        await result.current.login(payload);
      });

      expect(authService.login).toHaveBeenCalledWith(payload);
      expect(authService.login).toHaveBeenCalledTimes(1);
    });

    it('propaga el error si el login falla', async () => {
      const error = new Error('Credenciales inválidas');
      vi.mocked(authService.login).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), { wrapper: createQueryWrapper() });

      await expect(
        act(async () => {
          await result.current.login({ email: 'bad@example.com', password: 'wrong' });
        }),
      ).rejects.toThrow('Credenciales inválidas');

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('register()', () => {
    it('almacena al usuario tras un registro exitoso', async () => {
      vi.mocked(authService.register).mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth(), { wrapper: createQueryWrapper() });

      await act(async () => {
        await result.current.register({
          email: 'new@example.com',
          password: 'pass123',
          name: 'Nuevo Usuario',
        });
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('logout()', () => {
    it('limpia el estado tras hacer logout', async () => {
      // Simular usuario logueado
      useAuthStore.setState({ user: mockUser, accessToken: 'token', isAuthenticated: true, isInitializing: false });
      vi.mocked(authService.logout).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper: createQueryWrapper() });

      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        result.current.logout();
        // Pequeña espera para que la mutation se resuelva
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('limpia el estado incluso si el servidor falla durante logout', async () => {
      useAuthStore.setState({ user: mockUser, accessToken: 'token', isAuthenticated: true, isInitializing: false });
      vi.mocked(authService.logout).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper: createQueryWrapper() });

      await act(async () => {
        result.current.logout();
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
