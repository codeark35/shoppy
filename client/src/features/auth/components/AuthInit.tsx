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

    if (user && !accessToken) {
      authService
        .refresh()
        .then(({ accessToken: newToken }) => {
          setAuth(user, newToken);
        })
        .catch(() => {
          clearAuth();
        });
    }
    // Si no hay user guardado, isInitializing ya es false — no hace falta nada
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
