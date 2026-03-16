import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuthStore } from '../../auth/store/authStore';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayout() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Guard: solo ADMIN y WAREHOUSE ─────────────────────────────────────────
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (user.role !== 'ADMIN' && user.role !== 'WAREHOUSE') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-layout">
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="admin-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Área de contenido */}
      <div className={`admin-content${collapsed ? ' admin-content--collapsed' : ''}`}>
        {/* Topbar mobile */}
        <header className="admin-topbar d-lg-none">
          <button
            className="admin-topbar__burger"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <span className="admin-topbar__title">Panel Admin</span>
        </header>

        {/* Contenido de la página */}
        <div className="admin-page-wrap">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
