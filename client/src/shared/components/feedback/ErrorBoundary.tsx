import React from 'react';
import * as Sentry from '@sentry/react';
import { Button } from 'react-bootstrap';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Render alternativo al ocurrir un error. Si se provee, reemplaza el fallback por defecto. */
  fallback?: React.ReactNode;
  /** Callback para reportar el error (ej. Sentry). */
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Captura errores de render en el subárbol sin derribar toda la app.
 * Envolver cada página o sección crítica de admin con su propio ErrorBoundary.
 *
 * @example
 * <ErrorBoundary>
 *   <AdminProductsPage />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    this.props.onError?.(error, info);
    console.error('[ErrorBoundary]', error.message, info.componentStack);
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center px-3">
          <AlertTriangle size={48} className="text-warning mb-3" />
          <h5 className="fw-semibold mb-2">Algo salió mal</h5>
          <p className="text-muted small mb-4" style={{ maxWidth: 400 }}>
            {this.state.error?.message ?? 'Ocurrió un error inesperado en esta sección.'}
          </p>
          <Button variant="outline-primary" size="sm" onClick={this.handleReset}>
            Reintentar
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
