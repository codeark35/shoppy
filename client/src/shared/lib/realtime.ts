import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { config } from '../../core/config';

/**
 * Patrón real-time para actualizar React Query cache desde SSE o WebSocket.
 *
 * USO CON SSE (Server-Sent Events — recomendado para datos unidireccionales):
 *
 * @example
 * // En un hook de feature:
 * useEffect(() => {
 *   const es = createSSEConnection('/admin/inventory/stream');
 *   es.onmessage = (e) => {
 *     queryClient.setQueryData(['admin', 'inventory'], JSON.parse(e.data));
 *   };
 *   return () => es.close();
 * }, []);
 *
 * USO CON WebSocket (bidireccional — para chat, notificaciones interactivas):
 *
 * @example
 * const ws = createWSConnection('/ws/orders');
 * ws.onmessage = (e) => {
 *   const { event, data } = JSON.parse(e.data);
 *   if (event === 'order.created') {
 *     queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
 *   }
 * };
 */

/**
 * Crea una conexión SSE autenticada.
 * El token se pasa como query param ya que EventSource no admite headers.
 */
export function createSSEConnection(path: string, token?: string): EventSource {
  const url = new URL(`${config.apiBaseUrl}/${config.apiVersion}${path}`, window.location.origin);
  if (token) url.searchParams.set('token', token);
  return new EventSource(url.toString(), { withCredentials: true });
}

/**
 * Crea una conexión WebSocket autenticada.
 */
export function createWSConnection(path: string): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return new WebSocket(`${protocol}//${host}${config.apiBaseUrl}/${config.apiVersion}${path}`);
}

/**
 * Helper para invalidar queries de React Query desde un handler SSE/WS.
 * Centraliza el patrón y evita referencias directas al queryClient en componentes.
 */
export function createRealtimeInvalidator(queryClient: QueryClient) {
  return function invalidate(...queryKeys: QueryKey[]) {
    queryKeys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key as readonly unknown[] });
    });
  };
}
