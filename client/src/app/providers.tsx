import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../shared/lib/queryClient';
import { AuthInit } from '../features/auth/components/AuthInit';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInit />
      {children}
    </QueryClientProvider>
  );
}
