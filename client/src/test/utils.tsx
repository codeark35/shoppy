import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Crea un QueryWrapper para tests de hooks que usan React Query.
 * Cache desactivado y sin retries para que los tests fallen rápido.
 *
 * @example
 * const { result } = renderHook(() => useProducts(), {
 *   wrapper: createQueryWrapper(),
 * });
 */
export function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries:   { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  return function QueryWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}
