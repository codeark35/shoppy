import { useEffect, useRef } from 'react';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';

/**
 * Se monta una vez en la raíz de la app.
 * Si hay un usuario persistido en el store pero no hay accessToken en memoria
 * (situación tras un reload de página), llama a /auth/refresh para restaurar
 * la sesión usando la cookie HttpOnly refresh_token.
 * Si el refresh falla (sesión expirada), limpia el estado.
 */
export function AuthInit() {
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    // Solo intentar si hay usuario guardado pero no hay token en memoria
    if (user && !accessToken) {
      authService
        .refresh()
        .then(({ accessToken: newToken }) => {
          // Re-usar el usuario persistido, actualizar con el nuevo token
          setAuth(user, newToken);
        })
        .catch(() => {
          // Refresh token expirado o inválido → limpiar sesión
          clearAuth();
        });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
