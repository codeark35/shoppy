import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, ShoppingBag } from 'lucide-react';

const YEAR = new Date().getFullYear();

export function AppFooter() {
  return (
    <footer className="app-footer">
      {/* ── Cuerpo principal ──────────────────────────────────────── */}
      <div className="app-footer__body">
        <Container fluid="xl">
          <div className="app-footer__grid">

            {/* Columna 1 — Marca */}
            <div className="app-footer__brand">
              <Link to="/" className="app-footer__logo">
                🛍️ Mi Tienda
              </Link>
              <p className="app-footer__tagline">
                Tu marketplace de confianza. Electrónica, ropa, hogar y más,
                con envíos a todo el Paraguay.
              </p>
              <div className="app-footer__social">
                <a href="#" aria-label="Facebook" className="app-footer__social-btn">
                  <Facebook size={16} />
                </a>
                <a href="#" aria-label="Instagram" className="app-footer__social-btn">
                  <Instagram size={16} />
                </a>
                <a href="#" aria-label="Twitter / X" className="app-footer__social-btn">
                  <Twitter size={16} />
                </a>
              </div>
            </div>

            {/* Columna 2 — Tienda */}
            <div>
              <p className="app-footer__col-title">Tienda</p>
              <ul className="app-footer__links">
                <li><Link to="/productos">Catálogo</Link></li>
                <li><Link to="/productos?onSale=true">Ofertas</Link></li>
                <li><Link to="/productos?featured=true">Destacados</Link></li>
                <li><Link to="/buscar">Buscar</Link></li>
              </ul>
            </div>

            {/* Columna 3 — Mi cuenta */}
            <div>
              <p className="app-footer__col-title">Mi cuenta</p>
              <ul className="app-footer__links">
                <li><Link to="/cuenta">Perfil</Link></li>
                <li><Link to="/pedidos">Mis pedidos</Link></li>
                <li><Link to="/cuenta">Favoritos</Link></li>
                <li><Link to="/carrito">Carrito</Link></li>
              </ul>
            </div>

            {/* Columna 4 — Contacto */}
            <div>
              <p className="app-footer__col-title">Contacto</p>
              <ul className="app-footer__contact">
                <li>
                  <Phone size={14} />
                  <span>+595 981 100 000</span>
                </li>
                <li>
                  <Mail size={14} />
                  <span>hola@mitienda.com.py</span>
                </li>
                <li>
                  <MapPin size={14} />
                  <span>Asunción, Paraguay</span>
                </li>
              </ul>
            </div>

          </div>
        </Container>
      </div>

      {/* ── Barra inferior ────────────────────────────────────────── */}
      <div className="app-footer__bar">
        <Container fluid="xl">
          <div className="app-footer__bar-inner">
            <span>© {YEAR} Mi Tienda. Todos los derechos reservados.</span>
            <div className="app-footer__payments">
              <span className="app-footer__payment-chip">Visa</span>
              <span className="app-footer__payment-chip">Mastercard</span>
              <span className="app-footer__payment-chip">Efectivo</span>
              <span className="app-footer__payment-chip">
                <ShoppingBag size={11} style={{ marginRight: 3 }} />
                Contra entrega
              </span>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
