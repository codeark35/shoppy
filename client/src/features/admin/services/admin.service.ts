import api from '../../../shared/lib/api';
import type {
  AdminOrder,
  AdminInventoryVariant,
  AdminUser,
  PaginatedResponse,
  AdminOrderQuery,
  AdminProduct,
  AdminProductsQuery,
  CreateProductPayload,
  UpdateProductPayload,
  CreateVariantPayload,
  AdminCategory,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  AdminCoupon,
  CreateCouponPayload,
} from '../types/admin.types';
import type { OrderStatus } from '../../orders/types/orders.types';

export const adminService = {
  // ── Órdenes ──────────────────────────────────────────────────────────────────
  getOrders: (query: AdminOrderQuery = {}) => {
    const params: Record<string, string | number> = {};
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;
    if (query.status) params.status = query.status;
    return api
      .get<PaginatedResponse<AdminOrder>>('/admin/orders', { params })
      .then((r) => r.data);
  },

  updateOrderStatus: (orderId: string, status: OrderStatus, trackingNumber?: string) =>
    api
      .patch<AdminOrder>(`/admin/orders/${orderId}/status`, { status, trackingNumber })
      .then((r) => r.data),

  // ── Inventario ─────────────────────────────────────────────────────────────
  getInventory: (lowStock = false) =>
    api
      .get<AdminInventoryVariant[]>('/admin/inventory', {
        params: lowStock ? { lowStock: 'true' } : {},
      })
      .then((r) => r.data),

  updateStock: (variantId: string, stock: number) =>
    api
      .patch<{ id: string; sku: string; stock: number }>(
        `/admin/inventory/variants/${variantId}/stock`,
        { stock },
      )
      .then((r) => r.data),

  // ── Usuarios ──────────────────────────────────────────────────────────────
  getUsers: (page = 1, limit = 20) =>
    api
      .get<PaginatedResponse<AdminUser>>('/admin/users', { params: { page, limit } })
      .then((r) => r.data),

  updateUserRole: (userId: string, role: string) =>
    api
      .patch<{ id: string; email: string; role: string }>(`/admin/users/${userId}/role`, { role })
      .then((r) => r.data),

  // ── Productos ─────────────────────────────────────────────────────────────
  getProducts: (query: AdminProductsQuery = {}) =>
    api
      .get<PaginatedResponse<AdminProduct>>('/catalog/products', {
        params: { ...query, includeInactive: true },
      })
      .then((r) => r.data),

  createProduct: (payload: CreateProductPayload) =>
    api.post<AdminProduct>('/catalog/products', payload).then((r) => r.data),

  updateProduct: (id: string, payload: UpdateProductPayload) =>
    api.patch<AdminProduct>(`/catalog/products/${id}`, payload).then((r) => r.data),

  deleteProduct: (id: string) =>
    api.delete<{ message: string }>(`/catalog/products/${id}`).then((r) => r.data),

  addVariant: (productId: string, payload: CreateVariantPayload) =>
    api
      .post<AdminProduct>(`/catalog/products/${productId}/variants`, payload)
      .then((r) => r.data),

  // ── Categorías ────────────────────────────────────────────────────────────
  getCategories: () =>
    api.get<AdminCategory[]>('/catalog/categories').then((r) => r.data),

  createCategory: (payload: CreateCategoryPayload) =>
    api.post<AdminCategory>('/catalog/categories', payload).then((r) => r.data),

  updateCategory: (id: string, payload: UpdateCategoryPayload) =>
    api.patch<AdminCategory>(`/catalog/categories/${id}`, payload).then((r) => r.data),

  deleteCategory: (id: string) =>
    api.delete<{ message: string }>(`/catalog/categories/${id}`).then((r) => r.data),

  // ── Cupones ───────────────────────────────────────────────────────────────
  getCoupons: () =>
    api.get<AdminCoupon[]>('/promotions/coupons').then((r) => r.data),

  createCoupon: (payload: CreateCouponPayload) =>
    api.post<AdminCoupon>('/promotions/coupons', payload).then((r) => r.data),

  toggleCoupon: (id: string, isActive: boolean) =>
    api
      .patch<AdminCoupon>(`/promotions/coupons/${id}/toggle`, { isActive })
      .then((r) => r.data),
};
