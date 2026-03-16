import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../../cart/store/cartStore';
import type { LoginPayload, RegisterPayload } from '../types/auth.types';

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const { mergeCart } = useCartStore();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: async (data) => {
      setAuth(data.user, data.accessToken);
      await mergeCart();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: async (data) => {
      setAuth(data.user, data.accessToken);
      await mergeCart();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
    },
    onError: () => {
      // Si la API falla (ej: token expirado), igual limpiamos el estado local
      clearAuth();
      queryClient.clear();
    },
  });

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}
