import { useState, useEffect, useRef } from 'react';
import { Collapse, Container, Dropdown } from 'react-bootstrap';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Heart, User, LogOut, Package,
  BarChart2, Menu, X, Truck, Phone, ChevronDown, Tag, Sparkles, Star, Zap,
} from 'lucide-react';
import { CartDrawer } from '../../features/cart/components/CartDrawer';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useCartStore } from '../../features/cart/store/cartStore';
import { authService } from '../../features/auth/services/auth.service';
import { SearchBar } from '../../features/search/components/SearchBar';
import { useCategories } from '../../features/catalog/hooks/useProducts';

export function AppNavbar() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { cart, openCart } = useCartStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const megaRef = useRef<HTMLDivElement>(null);
  const itemCount = cart.itemCount;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cerrar mega-menu al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const rootCategories = categories?.filter((c) => !c.parentId) ?? [];

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
                <Dropdown align="end" className="d-none d-md-block">
                  <Dropdown.Toggle
                    as="button"
                    className="nav-action-btn"
                    title={user?.name}
                    bsPrefix=" "
                  >
                    <User size={20} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="shadow">
                    <Dropdown.Header>
                      <div className="fw-semibold text-dark">{user?.name}</div>
                      <div className="small text-muted">{user?.email}</div>
                    </Dropdown.Header>
                    <Dropdown.Divider />
                    {user?.role === 'ADMIN' && (
                      <Dropdown.Item as={Link} to="/admin/dashboard">
                        <BarChart2 size={15} className="me-2" />Dashboard admin
                      </Dropdown.Item>
                    )}
                    <Dropdown.Item as={Link} to="/pedidos">
                      <Package size={15} className="me-2" />Mis pedidos
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/cuenta">
                      <User size={15} className="me-2" />Mi cuenta
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout} className="text-danger">
                      <LogOut size={15} className="me-2" />Cerrar sesión
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                <button
                  className="btn btn-primary btn-sm d-none d-md-flex align-items-center gap-1"
                  style={{ borderRadius: 'var(--radius-pill)', fontSize: '0.82rem', padding: '7px 16px' }}
                  onClick={() => navigate('/login')}
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
                  <button onClick={() => { navigate('/login'); setMenuOpen(false); }}>
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

            {/* Botón Categorías con mega-menú */}
            <div className="mega-menu-wrapper" ref={megaRef}>
              <button
                className={`category-navbar__mega-btn${megaOpen ? ' active' : ''}`}
                onClick={() => setMegaOpen((o) => !o)}
                aria-expanded={megaOpen}
              >
                <Menu size={15} className="me-1" />
                Categorías
                <ChevronDown size={13} className={`mega-chevron${megaOpen ? ' open' : ''}`} />
              </button>

              {/* Mega-menú desplegable */}
              {megaOpen && (
                <div className="mega-menu" role="dialog" aria-label="Todas las categorías">
                  <div className="mega-menu__grid">
                    {rootCategories.map((cat) => (
                      <div key={cat.id} className="mega-menu__group">
                        <Link
                          to={`/productos?categoria=${cat.slug}`}
                          className="mega-menu__group-title"
                          onClick={() => setMegaOpen(false)}
                        >
                          {cat.name}
                        </Link>
                        {cat.children?.length ? (
                          <ul className="mega-menu__sub-list">
                            {cat.children.map((sub) => (
                              <li key={sub.id}>
                                <Link
                                  to={`/productos?categoria=${sub.slug}`}
                                  className="mega-menu__sub-link"
                                  onClick={() => setMegaOpen(false)}
                                >
                                  {sub.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Accesos rápidos */}
            
            <NavLink to="/" end className="nav-link">Inicio</NavLink>
            <Link to="/productos?onSale=true" className="nav-link nav-link--offers">
              <Tag size={13} className="me-1" />Ofertas
            </Link>
            <Link to="/productos?featured=true" className="nav-link">
              <Star size={13} className="me-1" />Destacados
            </Link>
            <Link to="/productos" className="nav-link">
              <Sparkles size={13} className="me-1" />Novedades
            </Link>
            <Link to="/productos" className="nav-link">
              <Zap size={13} className="me-1" />Más vendidos
            </Link>
          </nav>
        </Container>
      </div>

      <CartDrawer />
    </>
  );
}

