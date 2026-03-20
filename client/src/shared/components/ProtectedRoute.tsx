import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { useAuthStore } from '../../features/auth/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Envuelve rutas que requieren autenticación.
 * - Mientras AuthInit resuelve el refresh: muestra spinner (no redirige).
 * - Si no autenticado tras inicializar: redirige a /login con returnTo.
 * - Si autenticado: renderiza children.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing } = useAuthStore();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
