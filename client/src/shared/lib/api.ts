import axios from 'axios';
import { useAuthStore } from '../../features/auth/store/authStore';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,         // enviar cookies HttpOnly (refresh_token)
  headers: { 'Content-Type': 'application/json' },
});

// ─── Interceptor request: adjuntar access token desde el store (en memoria) ────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Interceptor response: auto-refresh en 401 ────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string | null) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // No intentar refresh para la propia llamada de refresh (evitar loop)
    if (originalRequest?.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          '/api/v1/auth/refresh',
          {},
          { withCredentials: true },
        );
        const newToken = data.accessToken;

        // Actualiza el store en memoria (NO localStorage)
        useAuthStore.getState().setAccessToken(newToken);

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Limpiar estado y redirigir a inicio (no a /login que no existe)
        useAuthStore.getState().clearAuth();
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export { api };
export default api;
