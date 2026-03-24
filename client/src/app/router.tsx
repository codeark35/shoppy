import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { useEffect } from 'react';
import { analyticsTracker } from '../features/analytics/services/analytics.tracker';
import { HomePage } from '../pages/HomePage';
import { CatalogPage } from '../pages/CatalogPage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OrdersPage } from '../pages/OrdersPage';
import { OrderDetailPage } from '../pages/OrderDetailPage';
import { AccountPage } from '../pages/AccountPage';
import { CheckoutResultPage } from '../pages/CheckoutResultPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { AdminLayout } from '../features/admin/layout/AdminLayout';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';

const SearchPage         = lazy(() => import('../pages/SearchPage'));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage'));
const AdminOrdersPage    = lazy(() => import('../pages/AdminOrdersPage'));
const AdminInventoryPage = lazy(() => import('../pages/AdminInventoryPage'));
const AdminUsersPage     = lazy(() => import('../pages/AdminUsersPage'));
const AdminProductsPage  = lazy(() => import('../pages/AdminProductsPage'));
const AdminProductFormPage = lazy(() => import('../pages/AdminProductFormPage'));
const AdminCategoriesPage = lazy(() => import('../pages/AdminCategoriesPage'));
const AdminPromotionsPage           = lazy(() => import('../pages/AdminPromotionsPage'));
const AdminAutomaticPromotionsPage  = lazy(() => import('../pages/AdminAutomaticPromotionsPage'));
const AdminAuditPage                = lazy(() => import('../pages/AdminAuditPage'));
const AdminBannersPage              = lazy(() => import('../pages/AdminBannersPage'));
const AdminAnalyticsPage            = lazy(() => import('../pages/AdminAnalyticsPage'));
const AdminOrphanedImagesPage       = lazy(() => import('../pages/AdminOrphanedImagesPage'));
const WishlistPage                  = lazy(() => import('../pages/WishlistPage'));

const PageLoader = () => (
  <div className="d-flex justify-content-center align-items-center py-5">
    <Spinner animation="border" variant="primary" />
  </div>
);

function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    analyticsTracker.trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <PageTracker />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Rutas públicas ── */}
          <Route path="/" element={<HomePage />} />
          <Route path="/productos" element={<CatalogPage />} />
          <Route path="/productos/:slug" element={<ProductPage />} />
          <Route path="/carrito" element={<CartPage />} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/checkout/result" element={<ProtectedRoute><CheckoutResultPage /></ProtectedRoute>} />
          <Route path="/pedidos" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/pedidos/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
          <Route path="/cuenta" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="/favoritos" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
          <Route path="/buscar" element={<SearchPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />

          {/* ── Rutas Admin (requiere ADMIN o WAREHOUSE) ── */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard"   element={<AdminDashboardPage />} />
            <Route path="ordenes"     element={<AdminOrdersPage />} />
            <Route path="inventario"  element={<AdminInventoryPage />} />
            <Route path="usuarios"    element={<AdminUsersPage />} />
            <Route path="productos"   element={<AdminProductsPage />} />
            <Route path="productos/nuevo"        element={<AdminProductFormPage />} />
            <Route path="productos/:id/editar"   element={<AdminProductFormPage />} />
            <Route path="categorias"  element={<AdminCategoriesPage />} />
            <Route path="banners"              element={<AdminBannersPage />} />
            <Route path="analitica"            element={<AdminAnalyticsPage />} />
            <Route path="promociones"           element={<AdminPromotionsPage />} />
            <Route path="promociones-automaticas" element={<AdminAutomaticPromotionsPage />} />
            <Route path="auditoria"             element={<AdminAuditPage />} />
            <Route path="imagenes-huerfanas"    element={<AdminOrphanedImagesPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
