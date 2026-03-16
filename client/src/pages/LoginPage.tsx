import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useAuthStore } from '../features/auth/store/authStore';
import { AuthPageLayout } from '../features/auth/components/AuthPageLayout';

export function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
          'Email o contraseña incorrectos',
      );
    }
  };

  return (
    <AuthPageLayout>
      <div className="auth-form-wrap">
        <div className="auth-form-header">
          <h1>Iniciar sesión</h1>
          <p>
            ¿No tenés cuenta?{' '}
            <Link to="/registro">Registrate gratis</Link>
          </p>
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" aria-hidden />
              <Form.Control
                type="email"
                placeholder="nombre@ejemplo.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="auth-input"
                required
                autoComplete="email"
              />
            </div>
          </Form.Group>

          {/* Contraseña */}
          <Form.Group className="mb-4">
            <Form.Label>Contraseña</Form.Label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" aria-hidden />
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                placeholder="········"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="auth-input auth-input--toggle"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-toggle-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            className="w-100 auth-submit-btn"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Ingresando…
              </>
            ) : (
              'Ingresar'
            )}
          </Button>
        </Form>
      </div>
    </AuthPageLayout>
  );
}
