import React, { useState } from 'react';
import { Modal, Form, Button, Alert, Tab, Nav } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';
import { GoogleSignInButton } from './GoogleSignInButton';

interface LoginModalProps {
  show: boolean;
  onHide: () => void;
}

export function LoginModal({ show, onHide }: LoginModalProps) {
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    email: '', password: '', name: '', phone: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(loginForm);
      onHide();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al iniciar sesión');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register(registerForm);
      onHide();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al registrarse');
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Acceder a tu cuenta</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k as 'login' | 'register')}>
          <Nav variant="tabs" className="mb-3">
            <Nav.Item>
              <Nav.Link eventKey="login">Iniciar sesión</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="register">Registrarse</Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            <Tab.Pane eventKey="login">
              <GoogleSignInButton onSuccess={onHide} className="mb-3" />
              <div className="auth-divider">
                <span>o continuá con email</span>
              </div>
              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </Form.Group>
                <Button type="submit" variant="primary" className="w-100" disabled={isLoggingIn}>
                  {isLoggingIn ? 'Ingresando...' : 'Ingresar'}
                </Button>
              </Form>
            </Tab.Pane>

            <Tab.Pane eventKey="register">
              <GoogleSignInButton onSuccess={onHide} className="mb-3" />
              <div className="auth-divider">
                <span>o registrate con email</span>
              </div>
              <Form onSubmit={handleRegister}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre completo</Form.Label>
                  <Form.Control
                    type="text"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required minLength={6}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono (opcional)</Form.Label>
                  <Form.Control
                    type="tel"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  />
                </Form.Group>
                <Button type="submit" variant="primary" className="w-100" disabled={isRegistering}>
                  {isRegistering ? 'Creando cuenta...' : 'Crear cuenta'}
                </Button>
              </Form>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Modal.Body>
    </Modal>
  );
}
