import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useAuthStore } from '../features/auth/store/authStore';
import { AuthPageLayout } from '../features/auth/components/AuthPageLayout';

// ── Indicador de fortaleza ────────────────────────────────────────────────────
function getStrength(pwd: string): number {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

const STRENGTH_LABEL = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
const STRENGTH_COLOR = ['', 'danger', 'warning', 'info', 'success'];

// ─────────────────────────────────────────────────────────────────────────────

export function RegisterPage() {
  const { register, isRegistering } = useAuth();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handlePasswordChange = (pwd: string) => {
    setForm((prev) => ({ ...prev, password: pwd }));
    setStrength(getStrength(pwd));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register({ ...form, phone: form.phone || undefined });
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
          'Error al crear la cuenta',
      );
    }
  };

  return (
    <AuthPageLayout>
      <div className="auth-form-wrap">
        <div className="auth-form-header">
          <h1>Crear cuenta</h1>
          <p>
            ¿Ya tenés cuenta?{' '}
            <Link to="/login">Iniciá sesión</Link>
          </p>
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit} noValidate>
          {/* Nombre */}
          <Form.Group className="mb-3">
            <Form.Label>Nombre completo</Form.Label>
            <div className="auth-input-wrap">
              <User size={16} className="auth-input-icon" aria-hidden />
              <Form.Control
                type="text"
                placeholder="Juan Pérez"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="auth-input"
                required
                autoComplete="name"
              />
            </div>
          </Form.Group>

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

          {/* Contraseña + indicador de fortaleza */}
          <Form.Group className="mb-2">
            <Form.Label>Contraseña</Form.Label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" aria-hidden />
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="auth-input auth-input--toggle"
                required
                minLength={8}
                autoComplete="new-password"
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

            {form.password && (
              <div className="auth-strength mt-2">
                <div className="auth-strength-bar" role="progressbar" aria-valuenow={strength} aria-valuemin={0} aria-valuemax={4}>
                  {([1, 2, 3, 4] as const).map((s) => (
                    <div
                      key={s}
                      className={`auth-strength-segment${strength >= s ? ` auth-strength-segment--${STRENGTH_COLOR[strength]}` : ''}`}
                    />
                  ))}
                </div>
                <span className={`auth-strength-label text-${STRENGTH_COLOR[strength]}`}>
                  {STRENGTH_LABEL[strength]}
                </span>
              </div>
            )}
          </Form.Group>

          {/* Teléfono */}
          <Form.Group className="mb-4">
            <Form.Label>
              Teléfono{' '}
              <span className="text-muted fw-normal">(opcional)</span>
            </Form.Label>
            <div className="auth-input-wrap">
              <Phone size={16} className="auth-input-icon" aria-hidden />
              <Form.Control
                type="tel"
                placeholder="+595 9XX XXX XXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="auth-input"
                autoComplete="tel"
              />
            </div>
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            className="w-100 auth-submit-btn"
            disabled={isRegistering}
          >
            {isRegistering ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Creando cuenta…
              </>
            ) : (
              'Crear cuenta'
            )}
          </Button>

          <p className="auth-tos text-muted text-center mt-3">
            Al registrarte aceptás nuestros{' '}
            <a href="#">Términos y condiciones</a>
          </p>
        </Form>
      </div>
    </AuthPageLayout>
  );
}
