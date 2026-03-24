import api from '../../../shared/lib/api';
import type {
  AdminOrder,
  AdminInventoryVariant,
  AdminUser,
  PaginatedResponse,
  AdminOrderQuery,
  AdminProduct,
  AdminProductVariant,
  AdminProductImage,
  AdminProductsQuery,
  CreateProductPayload,
  UpdateProductPayload,
  CreateVariantPayload,
  UpdateVariantPayload,
  AddProductImagePayload,
  AdminCategory,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  AdminCoupon,
  CreateCouponPayload,
  AdminPromotion,
  CreatePromotionPayload,
  UpdatePromotionPayload,
  PromotionListQuery,
  AdminBanner,
  CreateBannerPayload,
  UpdateBannerPayload,
  OrphanedImage,
  AssignImagePayload,
} from '../types/admin.types';
import type { OrderStatus } from '../../orders/types/orders.types';
import type {
  AnalyticsSummary,
  TimeSeriesPoint,
  AnalyticsTopProduct,
  AnalyticsTopCategory,
  TopSearch,
  FunnelStep,
  AnalyticsQuery,
} from '../../analytics/types/analytics.types';

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
  getInventory: (lowStock = false, page = 1, limit = 20) =>
    api
      .get<{ items: AdminInventoryVariant[]; total: number; page: number; totalPages: number; lowStockCount: number }>(
        '/admin/inventory',
        { params: { ...(lowStock && { lowStock: 'true' }), page, limit } },
      )
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
      .get<{ data: AdminProduct[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
        '/catalog/products',
        { params: { ...query, includeInactive: true } },
      )
      .then((r) => ({
        items: r.data.data,
        total: r.data.meta.total,
        page: r.data.meta.page,
        totalPages: r.data.meta.totalPages,
      } as PaginatedResponse<AdminProduct>)),

  createProduct: (payload: CreateProductPayload) =>
    api.post<AdminProduct>('/catalog/products', payload).then((r) => r.data),

  updateProduct: (id: string, payload: UpdateProductPayload) =>
    api.patch<AdminProduct>(`/catalog/products/${id}`, payload).then((r) => r.data),

  getProductById: (id: string) =>
    api.get<AdminProduct>(`/catalog/products/id/${id}`).then((r) => r.data),

  deleteProduct: (id: string) =>
    api.delete<{ message: string }>(`/catalog/products/${id}`).then((r) => r.data),

  addProductImage: (productId: string, payload: AddProductImagePayload) =>
    api
      .post<AdminProductImage>(`/catalog/products/${productId}/images`, payload)
      .then((r) => r.data),

  deleteProductImage: (productId: string, imageId: string) =>
    api
      .delete<{ message: string }>(`/catalog/products/${productId}/images/${imageId}`)
      .then((r) => r.data),

  uploadMedia: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post<{ key: string; url: string }>('/media/upload', formData, {
        headers: { 'Content-Type': undefined },
      })
      .then((r) => r.data);
  },

  addVariant: (productId: string, payload: CreateVariantPayload) =>
    api
      .post<AdminProductVariant>(`/catalog/products/${productId}/variants`, payload)
      .then((r) => r.data),

  updateVariant: (productId: string, variantId: string, payload: UpdateVariantPayload) =>
    api
      .patch<AdminProductVariant>(`/catalog/products/${productId}/variants/${variantId}`, payload)
      .then((r) => r.data),

  deleteVariant: (productId: string, variantId: string) =>
    api
      .delete<{ message: string }>(`/catalog/products/${productId}/variants/${variantId}`)
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
  getCoupons: (page = 1, limit = 20) =>
    api
      .get<{ items: AdminCoupon[]; total: number; page: number; totalPages: number; activeCount: number; totalUses: number }>(
        '/promotions/coupons',
        { params: { page, limit } },
      )
      .then((r) => r.data),

  createCoupon: (payload: CreateCouponPayload) =>
    api.post<AdminCoupon>('/promotions/coupons', payload).then((r) => r.data),

  toggleCoupon: (id: string, isActive: boolean) =>
    api
      .patch<AdminCoupon>(`/promotions/coupons/${id}/toggle`, { isActive })
      .then((r) => r.data),

  // ── Promociones Automáticas ──────────────────────────────────────────────
  getPromotions: (query: PromotionListQuery = {}) =>
    api
      .get<{ items: AdminPromotion[]; total: number; page: number; totalPages: number }>(        '/promotions/automatic',
        { params: query },
      )
      .then((r) => r.data),

  getPromotionById: (id: string) =>
    api.get<AdminPromotion>(`/promotions/automatic/${id}`).then((r) => r.data),

  createPromotion: (payload: CreatePromotionPayload) =>
    api.post<AdminPromotion>('/promotions/automatic', payload).then((r) => r.data),

  updatePromotion: (id: string, payload: UpdatePromotionPayload) =>
    api.patch<AdminPromotion>(`/promotions/automatic/${id}`, payload).then((r) => r.data),

  togglePromotion: (id: string, isActive: boolean) =>
    api
      .patch<AdminPromotion>(`/promotions/automatic/${id}/toggle`, { isActive })
      .then((r) => r.data),

  deletePromotion: (id: string) =>
    api.delete<{ message: string }>(`/promotions/automatic/${id}`).then((r) => r.data),

  // ── Banners ─────────────────────────────────────────────────────────────────
  getBanners: (params?: { type?: string; isActive?: boolean }) =>
    api.get<AdminBanner[]>('/banners/admin', { params }).then((r) => r.data),

  getBannerById: (id: string) =>
    api.get<AdminBanner>(`/banners/admin/${id}`).then((r) => r.data),

  createBanner: (payload: CreateBannerPayload) =>
    api.post<AdminBanner>('/banners/admin', payload).then((r) => r.data),

  updateBanner: (id: string, payload: UpdateBannerPayload) =>
    api.patch<AdminBanner>(`/banners/admin/${id}`, payload).then((r) => r.data),

  toggleBanner: (id: string, isActive: boolean) =>
    api.patch<AdminBanner>(`/banners/admin/${id}/toggle`, { isActive }).then((r) => r.data),

  deleteBanner: (id: string) =>
    api.delete<{ success: boolean }>(`/banners/admin/${id}`).then((r) => r.data),

  reorderBanners: (items: { id: string; position: number }[]) =>
    api.post<{ success: boolean }>('/banners/admin/reorder', { items }).then((r) => r.data),

  // ── Analítica ────────────────────────────────────────────────────────────────
  getAnalyticsSummary: (params?: AnalyticsQuery) =>
    api.get<AnalyticsSummary>('/analytics/summary', { params }).then((r) => r.data),

  getAnalyticsVisits: (params?: AnalyticsQuery) =>
    api.get<TimeSeriesPoint[]>('/analytics/visits', { params }).then((r) => r.data),

  getAnalyticsRevenue: (params?: AnalyticsQuery) =>
    api.get<TimeSeriesPoint[]>('/analytics/revenue', { params }).then((r) => r.data),

  getAnalyticsTopProducts: (params?: AnalyticsQuery) =>
    api.get<AnalyticsTopProduct[]>('/analytics/top-products', { params }).then((r) => r.data),

  getAnalyticsTopCategories: (params?: AnalyticsQuery) =>
    api.get<AnalyticsTopCategory[]>('/analytics/top-categories', { params }).then((r) => r.data),

  getAnalyticsSearches: (params?: AnalyticsQuery) =>
    api.get<TopSearch[]>('/analytics/searches', { params }).then((r) => r.data),

  getAnalyticsFunnel: (params?: AnalyticsQuery) =>
    api.get<FunnelStep[]>('/analytics/funnel', { params }).then((r) => r.data),

  // ── Imágenes Huérfanas ────────────────────────────────────────────────────────
  getOrphanedImages: () =>
    api.get<OrphanedImage[]>('/admin/media/orphaned').then((r) => r.data),

  assignOrphanedImage: (payload: AssignImagePayload) =>
    api.post<AdminProductImage>('/admin/media/assign', payload).then((r) => r.data),
};
