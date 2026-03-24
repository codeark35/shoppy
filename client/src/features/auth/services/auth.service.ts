import api from '../../../shared/lib/api';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth.types';

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/google', { idToken });
    return data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async refresh(): Promise<{ accessToken: string }> {
    const { data } = await api.post<{ accessToken: string }>('/auth/refresh');
    return data;
  },

  async getProfile(): Promise<User> {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },
};
