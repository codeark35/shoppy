import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Truck, Shield, Package, ArrowLeft } from 'lucide-react';

interface AuthPageLayoutProps {
  children: ReactNode;
}

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <div className="auth-page">
      {/* ── Panel de marca (izquierdo) ── */}
      <aside className="auth-brand-panel" aria-hidden="true">
        <div className="auth-brand-orb auth-brand-orb--1" />
        <div className="auth-brand-orb auth-brand-orb--2" />
        <div className="auth-brand-orb auth-brand-orb--3" />

        <div className="auth-brand-content">
          <Link to="/" className="auth-brand-logo" tabIndex={-1}>
            <ShoppingBag size={28} strokeWidth={2.5} />
            <span>Labscore</span>
          </Link>

          <h2 className="auth-brand-headline">
            Tu tienda online,<br />siempre disponible.
          </h2>
          <p className="auth-brand-sub">
            Miles de productos con envíos a todo el Paraguay y pagos 100% seguros.
          </p>

          <ul className="auth-brand-features">
            <li>
              <span className="auth-feature-icon"><Truck size={15} /></span>
              Envíos a todo el Paraguay
            </li>
            <li>
              <span className="auth-feature-icon"><Shield size={15} /></span>
              Pagos 100% seguros
            </li>
            <li>
              <span className="auth-feature-icon"><Package size={15} /></span>
              Devoluciones fáciles
            </li>
          </ul>
        </div>
      </aside>

      {/* ── Panel de formulario (derecho) ── */}
      <main className="auth-form-panel">
        <Link to="/" className="auth-back-link">
          <ArrowLeft size={15} />
          <span>Volver a la tienda</span>
        </Link>

        {/* Logo visible solo en mobile (brand panel oculto) */}
        <div className="auth-mobile-logo">
          <Link to="/">
            <ShoppingBag size={22} strokeWidth={2.5} />
            <span>Labscore</span>
          </Link>
        </div>

        {children}
      </main>
    </div>
  );
}
