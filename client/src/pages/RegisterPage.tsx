import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * /registro ahora redirige a /login?tab=registro para mantener URLs antiguas funcionando.
 */
export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    navigate('/login?tab=registro', { replace: true, state: location.state });
  }, [navigate, location.state]);

  return null;
}
