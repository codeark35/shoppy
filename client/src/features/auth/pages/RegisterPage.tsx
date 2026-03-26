import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Redirige /registro → /login?tab=registro manteniendo el state de navegación
export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    navigate('/login?tab=registro', { replace: true, state: location.state });
  }, [navigate, location.state]);

  return null;
}
