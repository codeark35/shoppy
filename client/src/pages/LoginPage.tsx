import React, { useState } from 'react';
import { Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import { Eye, EyeOff, Mail, Lock, User, Phone, ShoppingBag } from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useAuthStore } from '../features/auth/store/authStore';
import { AuthPageLayout } from '../features/auth/components/AuthPageLayout';
import { GoogleSignInButton } from '../features/auth/components/GoogleSignInButton';

// ── Indicador de fortaleza de contraseña ─────────────────────────────────────
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

export function LoginPage() {
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const isCheckoutFlow = from.includes('/checkout') || from.includes('/pedidos');

  // Determinar tab inicial: ?tab=registro o viene de /registro
  const initialTab = searchParams.get('tab') === 'registro' ? 'register' : 'login';
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [strength, setStrength] = useState(0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      await login(loginForm);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setLoginError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
          'Email o contraseña incorrectos',
      );
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    try {
      await register({ ...regForm, phone: regForm.phone || undefined });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setRegError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
          'Error al crear la cuenta',
      );
    }
  };

  const handlePasswordChange = (pwd: string) => {
    setRegForm((p) => ({ ...p, password: pwd }));
    setStrength(getStrength(pwd));
  };

  // Si ya está autenticado (al acceder a /login estando logueado), redirigir
  if (isAuthenticated) return <Navigate to={from} replace />;

  return (
    <AuthPageLayout>
      <div className="auth-form-wrap">

        {/* Mensaje contextual del checkout */}
        {isCheckoutFlow && (
          <div className="auth-checkout-banner">
            <ShoppingBag size={18} className="flex-shrink-0" />
            <span>Iniciá sesión o creá tu cuenta para finalizar tu compra</span>
          </div>
        )}

        {/* Tabs: Login / Registro */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab${activeTab === 'login' ? ' auth-tab--active' : ''}`}
            onClick={() => { setActiveTab('login'); setLoginError(null); }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className={`auth-tab${activeTab === 'register' ? ' auth-tab--active' : ''}`}
            onClick={() => { setActiveTab('register'); setRegError(null); }}
          >
            Crear cuenta
          </button>
        </div>

        {/* ── LOGIN ── */}
        {activeTab === 'login' && (
          <div>
            {loginError && (
              <Alert variant="danger" dismissible onClose={() => setLoginError(null)}>
                {loginError}
              </Alert>
            )}

            <GoogleSignInButton className="mb-3" />
            <div className="auth-divider"><span>o continuá con email</span></div>

            <Form onSubmit={handleLogin} noValidate>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" aria-hidden />
                  <Form.Control
                    type="email"
                    placeholder="nombre@ejemplo.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="auth-input"
                    required
                    autoComplete="email"
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Contraseña</Form.Label>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" aria-hidden />
                  <Form.Control
                    type={showLoginPwd ? 'text' : 'password'}
                    placeholder="········"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="auth-input auth-input--toggle"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-toggle-btn"
                    onClick={() => setShowLoginPwd((v) => !v)}
                    aria-label={showLoginPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showLoginPwd ? <EyeOff size={16} /> : <Eye size={16} />}
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
                  <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Ingresando…</>
                ) : isCheckoutFlow ? 'Ingresar y continuar compra' : 'Ingresar'}
              </Button>
            </Form>

            <p className="text-center text-muted mt-3 mb-0" style={{ fontSize: '0.85rem' }}>
              ¿No tenés cuenta?{' '}
              <button
                type="button"
                className="btn btn-link p-0 align-baseline"
                style={{ fontSize: '0.85rem' }}
                onClick={() => setActiveTab('register')}
              >
                Registrate gratis
              </button>
            </p>
          </div>
        )}

        {/* ── REGISTRO ── */}
        {activeTab === 'register' && (
          <div>
            {regError && (
              <Alert variant="danger" dismissible onClose={() => setRegError(null)}>
                {regError}
              </Alert>
            )}

            <GoogleSignInButton className="mb-3" />
            <div className="auth-divider"><span>o registrate con email</span></div>

            <Form onSubmit={handleRegister} noValidate>
              <Form.Group className="mb-3">
                <Form.Label>Nombre completo</Form.Label>
                <div className="auth-input-wrap">
                  <User size={16} className="auth-input-icon" aria-hidden />
                  <Form.Control
                    type="text"
                    placeholder="Juan Pérez"
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    className="auth-input"
                    required
                    autoComplete="name"
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" aria-hidden />
                  <Form.Control
                    type="email"
                    placeholder="nombre@ejemplo.com"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    className="auth-input"
                    required
                    autoComplete="email"
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Contraseña</Form.Label>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" aria-hidden />
                  <Form.Control
                    type={showRegPwd ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={regForm.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="auth-input auth-input--toggle"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-toggle-btn"
                    onClick={() => setShowRegPwd((v) => !v)}
                    aria-label={showRegPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showRegPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {regForm.password && (
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

              <Form.Group className="mb-4">
                <Form.Label>
                  Teléfono <span className="text-muted fw-normal">(opcional)</span>
                </Form.Label>
                <div className="auth-input-wrap">
                  <Phone size={16} className="auth-input-icon" aria-hidden />
                  <Form.Control
                    type="tel"
                    placeholder="+595 9XX XXX XXX"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
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
                  <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Creando cuenta…</>
                ) : isCheckoutFlow ? 'Crear cuenta y continuar compra' : 'Crear cuenta'}
              </Button>
            </Form>

            <p className="text-center text-muted mt-3 mb-0" style={{ fontSize: '0.85rem' }}>
              ¿Ya tenés cuenta?{' '}
              <button
                type="button"
                className="btn btn-link p-0 align-baseline"
                style={{ fontSize: '0.85rem' }}
                onClick={() => setActiveTab('login')}
              >
                Iniciá sesión
              </button>
            </p>
          </div>
        )}
      </div>
    </AuthPageLayout>
  );
}

