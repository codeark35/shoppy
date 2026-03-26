import { useEffect, useRef } from 'react';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';

/**
 * Se monta una vez en la raíz de la app.
 * Si hay un usuario persistido en el store pero no hay accessToken en memoria
 * (situación tras un reload de página), llama a /auth/refresh para restaurar
 * la sesión usando la cookie HttpOnly refresh_token.
 * Si el refresh falla con 401/403 (sesión expirada), limpia el estado.
 * Si falla por error de red, NO limpia el estado — solo libera el loading.
 */
export function AuthInit() {
  const { user, accessToken, setAuth, clearAuth, setInitializing } = useAuthStore();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    if (user && !accessToken) {
      authService
        .refresh()
        .then(({ accessToken: newToken }) => {
          setAuth(user, newToken);
        })
        .catch((err: unknown) => {
          const status = (err as { response?: { status?: number } }).response?.status;
          if (status === 401 || status === 403) {
            // Sesión expirada o inválida → limpiar
            clearAuth();
          } else {
            // Error de red o servidor caído → no eliminar la sesión,
            // solo liberar el estado de carga para que el usuario pueda interactuar
            setInitializing(false);
          }
        });
    } else if (!user) {
      // No hay usuario guardado, isInitializing ya debería ser false,
      // pero lo forzamos por seguridad para evitar spinner permanente.
      setInitializing(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

