import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { useEffect } from 'react';
import { analyticsTracker } from '../features/analytics/services/analytics.tracker';
import { HomePage } from '../features/catalog/pages/HomePage';
import { CatalogPage } from '../features/catalog/pages/CatalogPage';
import { ProductPage } from '../features/catalog/pages/ProductPage';
import { CartPage } from '../features/cart/pages/CartPage';
import { CheckoutPage } from '../features/checkout/pages/CheckoutPage';
import { OrdersPage } from '../features/orders/pages/OrdersPage';
import { OrderDetailPage } from '../features/orders/pages/OrderDetailPage';
import { AccountPage } from '../features/account/pages/AccountPage';
import { CheckoutResultPage } from '../features/checkout/pages/CheckoutResultPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { AdminLayout } from '../features/admin/layout/AdminLayout';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';

const RegisterPage              = lazy(() => import('../features/auth/pages/RegisterPage'));
const SearchPage                = lazy(() => import('../features/search/pages/SearchPage'));
const WishlistPage              = lazy(() => import('../features/wishlist/pages/WishlistPage'));
const AdminDashboardPage        = lazy(() => import('../features/admin/pages/AdminDashboardPage'));
const AdminOrdersPage           = lazy(() => import('../features/admin/pages/AdminOrdersPage'));
const AdminInventoryPage        = lazy(() => import('../features/admin/pages/AdminInventoryPage'));
const AdminUsersPage            = lazy(() => import('../features/admin/pages/AdminUsersPage'));
const AdminProductsPage         = lazy(() => import('../features/admin/pages/AdminProductsPage'));
const AdminProductFormPage      = lazy(() => import('../features/admin/pages/AdminProductFormPage'));
const AdminCategoriesPage       = lazy(() => import('../features/admin/pages/AdminCategoriesPage'));
const AdminPromotionsPage       = lazy(() => import('../features/admin/pages/AdminPromotionsPage'));
const AdminAutomaticPromotionsPage = lazy(() => import('../features/admin/pages/AdminAutomaticPromotionsPage'));
const AdminAuditPage            = lazy(() => import('../features/admin/pages/AdminAuditPage'));
const AdminBannersPage          = lazy(() => import('../features/admin/pages/AdminBannersPage'));
const AdminAnalyticsPage        = lazy(() => import('../features/admin/pages/AdminAnalyticsPage'));
const AdminOrphanedImagesPage   = lazy(() => import('../features/admin/pages/AdminOrphanedImagesPage'));

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
