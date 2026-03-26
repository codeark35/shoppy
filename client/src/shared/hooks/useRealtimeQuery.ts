import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { createSSEConnection } from '../lib/realtime';
import { useAuthStore } from '../../features/auth/store/authStore';

interface UseRealtimeQueryOptions<TData> extends Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'> {
  /** Función que obtiene el estado inicial (snapshot) desde la API REST. */
  queryFn: () => Promise<TData>;
  /**
   * Path SSE relativo al API base (ej: '/admin/inventory/stream').
   * Si es null/undefined, el hook funciona como un useQuery normal sin SSE.
   */
  ssePath?: string | null;
  /**
   * Cómo manejar los mensajes SSE.
   * - 'replace' (default): reemplaza todo el dato del cache con el payload recibido.
   * - 'invalidate': invalida la query para que React Query haga un refetch.
   * - función custom: recibe (currentData, newPayload) y retorna el nuevo dato.
   */
  onMessage?: 'replace' | 'invalidate' | ((current: TData | undefined, payload: TData) => TData);
}

/**
 * Hook que combina React Query con SSE para datos en tiempo real.
 *
 * Obtiene el estado inicial vía REST y luego mantiene el cache actualizado
 * mediante una conexión SSE mientras el componente está montado.
 *
 * @example
 * const { data: inventory } = useRealtimeQuery({
 *   queryKey: ['admin', 'inventory'],
 *   queryFn: () => adminService.getInventory(),
 *   ssePath: '/admin/inventory/stream',
 * });
 *
 * @example — Con merge custom (ej: lista paginada con updates parciales)
 * const { data: orders } = useRealtimeQuery({
 *   queryKey: ['admin', 'orders', 'live'],
 *   queryFn: () => adminService.getRecentOrders(),
 *   ssePath: '/admin/orders/stream',
 *   onMessage: (current, payload) => ({
 *     ...current,
 *     items: [payload, ...(current?.items ?? [])],
 *   }),
 * });
 */
export function useRealtimeQuery<TData>(options: UseRealtimeQueryOptions<TData> & { queryKey: QueryKey }) {
  const { queryKey, queryFn, ssePath, onMessage = 'replace', ...queryOptions } = options;
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();
  const esRef = useRef<EventSource | null>(null);

  const query = useQuery<TData>({
    queryKey,
    queryFn,
    ...queryOptions,
  });

  useEffect(() => {
    if (!ssePath) return;

    // Cerrar conexión previa si existe (ej: cambio de ssePath)
    esRef.current?.close();

    const es = createSSEConnection(ssePath, accessToken ?? undefined);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as TData;

        if (onMessage === 'invalidate') {
          queryClient.invalidateQueries({ queryKey: queryKey as readonly unknown[] });
        } else if (onMessage === 'replace') {
          queryClient.setQueryData(queryKey as readonly unknown[], payload);
        } else {
          queryClient.setQueryData(queryKey as readonly unknown[], (current: TData | undefined) =>
            onMessage(current, payload),
          );
        }
      } catch {
        // Mensaje malformado — ignorar silenciosamente
      }
    };

    es.onerror = () => {
      // El browser reintenta automáticamente las conexiones SSE.
      // Solo cerramos si el error es definitivo (readyState === CLOSED).
      if (es.readyState === EventSource.CLOSED) {
        esRef.current = null;
      }
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [ssePath, accessToken, queryClient, queryKey, onMessage]);

  return query;
}
