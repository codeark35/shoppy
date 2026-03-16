import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
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

const SearchPage         = lazy(() => import('../pages/SearchPage'));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage'));
const AdminOrdersPage    = lazy(() => import('../pages/AdminOrdersPage'));
const AdminInventoryPage = lazy(() => import('../pages/AdminInventoryPage'));
const AdminUsersPage     = lazy(() => import('../pages/AdminUsersPage'));
const AdminProductsPage  = lazy(() => import('../pages/AdminProductsPage'));
const AdminCategoriesPage = lazy(() => import('../pages/AdminCategoriesPage'));
const AdminPromotionsPage = lazy(() => import('../pages/AdminPromotionsPage'));
const AdminAuditPage     = lazy(() => import('../pages/AdminAuditPage'));

const PageLoader = () => (
  <div className="d-flex justify-content-center align-items-center py-5">
    <Spinner animation="border" variant="primary" />
  </div>
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Rutas públicas ── */}
          <Route path="/" element={<HomePage />} />
          <Route path="/productos" element={<CatalogPage />} />
          <Route path="/productos/:slug" element={<ProductPage />} />
          <Route path="/carrito" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/result" element={<CheckoutResultPage />} />
          <Route path="/pedidos" element={<OrdersPage />} />
          <Route path="/pedidos/:id" element={<OrderDetailPage />} />
          <Route path="/cuenta" element={<AccountPage />} />
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
            <Route path="categorias"  element={<AdminCategoriesPage />} />
            <Route path="promociones" element={<AdminPromotionsPage />} />
            <Route path="auditoria"   element={<AdminAuditPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
