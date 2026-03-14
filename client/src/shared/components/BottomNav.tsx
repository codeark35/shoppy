import { NavLink } from 'react-router-dom';
import { Home, Search, ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '../../features/cart/store/cartStore';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Inicio', exact: true },
  { to: '/productos', icon: Search, label: 'Catálogo', exact: false },
  { to: '/carrito', icon: ShoppingCart, label: 'Carrito', exact: false },
  { to: '/cuenta', icon: User, label: 'Cuenta', exact: false },
];

export function BottomNav() {
  const { cart } = useCartStore();
  const itemCount = cart.itemCount;

  return (
    <nav
      className="d-md-none fixed-bottom bg-white border-top shadow-sm"
      style={{ zIndex: 1030 }}
    >
      <div className="d-flex">
        {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex-fill d-flex flex-column align-items-center justify-content-center py-2 text-decoration-none ${
                isActive ? 'text-primary' : 'text-muted'
              }`
            }
            style={{ minHeight: 56 }}
          >
            <div className="position-relative">
              <Icon size={22} />
              {to === '/carrito' && itemCount > 0 && (
                <span
                  className="position-absolute bg-danger text-white rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: 16,
                    height: 16,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    top: -6,
                    right: -8,
                  }}
                >
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.65rem', marginTop: 2 }}>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
