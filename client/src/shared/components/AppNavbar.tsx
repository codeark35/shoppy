import { useState, useEffect } from 'react';
import { Collapse, Container } from 'react-bootstrap';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Heart, User, LogOut, Package,
  BarChart2, Menu, X, Truck, Phone,
} from 'lucide-react';
import { CartDrawer } from '../../features/cart/components/CartDrawer';
import { LoginModal } from '../../features/auth/components/LoginModal';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useCartStore } from '../../features/cart/store/cartStore';
import { authService } from '../../features/auth/services/auth.service';
import { SearchBar } from '../../features/search/components/SearchBar';
import { useCategories } from '../../features/catalog/hooks/useProducts';

export function AppNavbar() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { cart, openCart } = useCartStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const itemCount = cart.itemCount;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignorar */ }
    clearAuth();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <>
      {/* ── Topbar ─────────────────────────────────────────────────── */}
      <div className="topbar d-none d-md-block">
        <Container fluid="xl">
          <div className="topbar__inner">
            <span><Truck size={13} /> Envíos a todo el país</span>
            <span className="topbar-sep">|</span>
            <span><Phone size={13} /> Atención: +595 981 100 000</span>
          </div>
        </Container>
      </div>

      {/* ── Main Navbar ────────────────────────────────────────────── */}
      <div className={`main-navbar${scrolled ? ' scrolled' : ''}`}>
        <Container fluid="xl">
          <div className="main-navbar__inner">
            {/* Logo */}
            <Link to="/" className="navbar-brand me-0 me-md-2" style={{ flexShrink: 0 }}>
              🛍️ Mi Tienda
            </Link>

            {/* Buscador — desktop */}
            <div className="search-wrapper d-none d-md-block">
              <SearchBar />
            </div>

            {/* Acciones */}
            <div className="nav-actions">
              {/* Wishlist — solo desktop */}
              {isAuthenticated && (
                <button
                  className="nav-action-btn d-none d-md-flex"
                  onClick={() => navigate('/cuenta')}
                  title="Mis favoritos"
                >
                  <Heart size={20} />
                </button>
              )}

              {/* Carrito */}
              <button className="nav-action-btn" onClick={openCart} aria-label="Carrito">
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="badge-count">{itemCount > 9 ? '9+' : itemCount}</span>
                )}
              </button>

              {/* Usuario — desktop */}
              {isAuthenticated ? (
                <div className="dropdown d-none d-md-block">
                  <button
                    className="nav-action-btn"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    title={user?.name}
                  >
                    <User size={20} />
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow">
                    <li>
                      <span className="dropdown-item-text fw-semibold text-dark">{user?.name}</span>
                      <span className="dropdown-item-text small text-muted" style={{ paddingTop: 0 }}>{user?.email}</span>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    {user?.role === 'ADMIN' && (
                      <li>
                        <Link className="dropdown-item" to="/admin/dashboard">
                          <BarChart2 size={15} className="me-2" />Dashboard admin
                        </Link>
                      </li>
                    )}
                    <li>
                      <Link className="dropdown-item" to="/pedidos">
                        <Package size={15} className="me-2" />Mis pedidos
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/cuenta">
                        <User size={15} className="me-2" />Mi cuenta
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item text-danger" onClick={handleLogout}>
                        <LogOut size={15} className="me-2" />Cerrar sesión
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <button
                  className="btn btn-primary btn-sm d-none d-md-flex align-items-center gap-1"
                  style={{ borderRadius: 'var(--radius-pill)', fontSize: '0.82rem', padding: '7px 16px' }}
                  onClick={() => setShowLoginModal(true)}
                >
                  <User size={15} /> Ingresar
                </button>
              )}

              {/* Hamburger — mobile */}
              <button
                className="nav-action-btn d-md-none"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Menú"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Buscador — mobile (segunda fila) */}
          <div className="d-md-none pb-2 mt-1">
            <SearchBar />
          </div>
        </Container>

        {/* Menú mobile expandible */}
        <Collapse in={menuOpen}>
          <div className="mobile-menu">
            <Container fluid="xl">
              <nav className="mobile-menu__nav">
                <NavLink to="/" end onClick={() => setMenuOpen(false)}>Inicio</NavLink>
                <NavLink to="/productos" onClick={() => setMenuOpen(false)}>Catálogo</NavLink>
                {isAuthenticated ? (
                  <>
                    <NavLink to="/pedidos" onClick={() => setMenuOpen(false)}>Mis pedidos</NavLink>
                    <NavLink to="/cuenta" onClick={() => setMenuOpen(false)}>Mi cuenta</NavLink>
                    {user?.role === 'ADMIN' && (
                      <NavLink to="/admin/dashboard" onClick={() => setMenuOpen(false)}>
                        Dashboard admin
                      </NavLink>
                    )}
                    <button onClick={handleLogout} style={{ color: '#DC2626' }}>
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <button onClick={() => { setShowLoginModal(true); setMenuOpen(false); }}>
                    Iniciar sesión
                  </button>
                )}
              </nav>
            </Container>
          </div>
        </Collapse>
      </div>

      {/* ── Category Navbar — desktop ──────────────────────────────── */}
      <div className="category-navbar d-none d-md-block">
        <Container fluid="xl">
          <nav className="category-navbar__nav">
            <NavLink to="/" end className="nav-link">Inicio</NavLink>
            <NavLink to="/productos" className="nav-link">Catálogo</NavLink>
            {categories
              ?.filter((c) => !c.parentId)
              .slice(0, 6)
              .map((cat) => (
                <Link
                  key={cat.id}
                  to={`/productos?categoria=${cat.slug}`}
                  className="nav-link"
                >
                  {cat.name}
                </Link>
              ))}
          </nav>
        </Container>
      </div>

      <CartDrawer />
      <LoginModal show={showLoginModal} onHide={() => setShowLoginModal(false)} />
    </>
  );
}

