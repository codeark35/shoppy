import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart2,
  Package,
  Tag,
  Boxes,
  Percent,
  Zap,
  ShoppingBag,
  Users,
  FileSearch,
  Image,
  TrendingUp,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { authService } from '../../auth/services/auth.service';
import { useAuthStore } from '../../auth/store/authStore';

// ── Tipos internos ─────────────────────────────────────────────────────────────

type AllowedRole = 'ADMIN' | 'WAREHOUSE';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  roles: AllowedRole[];
}

interface NavSection {
  section: string;
  items: NavItem[];
}

// ── Definición de la navegación ───────────────────────────────────────────────

const NAV_SECTIONS: NavSection[] = [
  {
    section: 'General',
    items: [
      { to: '/admin/dashboard', icon: BarChart2, label: 'Dashboard', roles: ['ADMIN'] },
      { to: '/admin/analitica', icon: TrendingUp, label: 'Analítica', roles: ['ADMIN'] },
    ],
  },
  {
    section: 'Catálogo',
    items: [
      { to: '/admin/productos', icon: Package, label: 'Productos', roles: ['ADMIN'] },
      { to: '/admin/categorias', icon: Tag, label: 'Categorías', roles: ['ADMIN'] },
      { to: '/admin/inventario', icon: Boxes, label: 'Inventario', roles: ['ADMIN', 'WAREHOUSE'] },
      { to: '/admin/banners', icon: Image, label: 'Banners', roles: ['ADMIN'] },
      { to: '/admin/promociones', icon: Percent, label: 'Cupones', roles: ['ADMIN'] },
      { to: '/admin/promociones-automaticas', icon: Zap, label: 'Promociones Auto.', roles: ['ADMIN'] },
    ],
  },
  {
    section: 'Operaciones',
    items: [
      { to: '/admin/ordenes', icon: ShoppingBag, label: 'Órdenes', roles: ['ADMIN', 'WAREHOUSE'] },
    ],
  },
  {
    section: 'Gestión',
    items: [
      { to: '/admin/usuarios', icon: Users, label: 'Usuarios', roles: ['ADMIN'] },
      { to: '/admin/auditoria', icon: FileSearch, label: 'Auditoría', roles: ['ADMIN'] },
    ],
  },
];

// ── Props ──────────────────────────────────────────────────────────────────────

interface AdminSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onMobileClose: () => void;
}

// ── Componente ─────────────────────────────────────────────────────────────────

export function AdminSidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onMobileClose,
}: AdminSidebarProps) {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignorar */ }
    clearAuth();
    navigate('/');
  };

  const userRole = (user?.role ?? '') as AllowedRole;

  // Iniciales del usuario para el avatar
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w: string) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const sidebarClass = [
    'admin-sidebar',
    collapsed ? 'admin-sidebar--collapsed' : '',
    mobileOpen ? 'admin-sidebar--mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <aside className={sidebarClass} aria-label="Navegación del panel admin">
      {/* ── Header ── */}
      <div className="admin-sidebar__header">
        <div className="admin-sidebar__brand">
          <ShoppingBag size={20} strokeWidth={2.5} className="admin-sidebar__brand-icon" />
          {!collapsed && <span className="admin-sidebar__brand-text">Labscore</span>}
        </div>

        {/* Botón colapsar — desktop */}
        <button
          className="admin-sidebar__collapse-btn d-none d-lg-flex"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>

        {/* Botón cerrar — mobile */}
        <button
          className="admin-sidebar__collapse-btn d-lg-none"
          onClick={onMobileClose}
          aria-label="Cerrar menú"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Chip de rol ── */}
      {!collapsed && (
        <div className="admin-sidebar__role-chip">
          <span className={`admin-role-badge admin-role-badge--${userRole.toLowerCase()}`}>
            {userRole === 'ADMIN' ? '⚡ Administrador' : '📦 Almacén'}
          </span>
        </div>
      )}

      {/* ── Navegación ── */}
      <nav className="admin-sidebar__nav" aria-label="Menú lateral">
        {NAV_SECTIONS.map(({ section, items }) => {
          const visible = items.filter((item) => item.roles.includes(userRole));
          if (visible.length === 0) return null;

          return (
            <div key={section} className="admin-nav-section">
              {!collapsed && (
                <span className="admin-nav-section__label">{section}</span>
              )}
              {visible.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/admin/dashboard'}
                  className={({ isActive }) =>
                    `admin-nav-item${isActive ? ' admin-nav-item--active' : ''}`
                  }
                  title={collapsed ? label : undefined}
                  onClick={onMobileClose}
                >
                  <Icon size={18} className="admin-nav-item__icon" strokeWidth={1.75} />
                  {!collapsed && <span className="admin-nav-item__label">{label}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* ── Footer — usuario + logout ── */}
      <div className="admin-sidebar__footer">
        <div className="admin-user-info" title={collapsed ? `${user?.name} (${userRole})` : undefined}>
          <div className="admin-user-avatar">{initials}</div>
          {!collapsed && (
            <div className="admin-user-meta">
              <span className="admin-user-name">{user?.name}</span>
              <span className="admin-user-email">{user?.email}</span>
            </div>
          )}
        </div>

        <button
          className="admin-logout-btn"
          onClick={handleLogout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut size={16} strokeWidth={1.75} />
          {!collapsed && <span>Salir</span>}
        </button>
      </div>
    </aside>
  );
}
