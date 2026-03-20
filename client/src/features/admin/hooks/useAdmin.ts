import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import type {
  AdminOrderQuery,
  AdminProductsQuery,
  CreateProductPayload,
  UpdateProductPayload,
  CreateVariantPayload,
  UpdateVariantPayload,
  AddProductImagePayload,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CreateCouponPayload,
  CreatePromotionPayload,
  UpdatePromotionPayload,
  PromotionListQuery,
  CreateBannerPayload,
  UpdateBannerPayload,
} from '../types/admin.types';
import type { OrderStatus } from '../../orders/types/orders.types';
import type { AnalyticsQuery } from '../../analytics/types/analytics.types';

// ── Órdenes ───────────────────────────────────────────────────────────────────

export const useAdminOrders = (query: AdminOrderQuery = {}) =>
  useQuery({
    queryKey: ['admin', 'orders', query],
    queryFn: () => adminService.getOrders(query),
  });

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      trackingNumber,
    }: {
      id: string;
      status: OrderStatus;
      trackingNumber?: string;
    }) => adminService.updateOrderStatus(id, status, trackingNumber),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'orders'] }),
  });
};

// ── Inventario ────────────────────────────────────────────────────────────────

export const useAdminInventory = (lowStock = false, page = 1, limit = 20) =>
  useQuery({
    queryKey: ['admin', 'inventory', lowStock, page, limit],
    queryFn: () => adminService.getInventory(lowStock, page, limit),
  });

export const useUpdateStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, stock }: { variantId: string; stock: number }) =>
      adminService.updateStock(variantId, stock),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'inventory'] }),
  });
};

// ── Usuarios ──────────────────────────────────────────────────────────────────

export const useAdminUsers = (page = 1, limit = 20) =>
  useQuery({
    queryKey: ['admin', 'users', page, limit],
    queryFn: () => adminService.getUsers(page, limit),
  });

export const useUpdateUserRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      adminService.updateUserRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
};

// ── Productos ─────────────────────────────────────────────────────────────────

export const useAdminProducts = (query: AdminProductsQuery = {}) =>
  useQuery({
    queryKey: ['admin', 'products', query],
    queryFn: () => adminService.getProducts(query),
  });

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => adminService.createProduct(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProductPayload }) =>
      adminService.updateProduct(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
};

export const useAddProductImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: AddProductImagePayload }) =>
      adminService.addProductImage(productId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
};

export const useDeleteProductImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, imageId }: { productId: string; imageId: string }) =>
      adminService.deleteProductImage(productId, imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
};

export const useAdminProductById = (id: string | null) =>
  useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => adminService.getProductById(id!),
    enabled: !!id,
  });

export const useAddVariant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: CreateVariantPayload }) =>
      adminService.addVariant(productId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
};

export const useUpdateVariant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, variantId, payload }: { productId: string; variantId: string; payload: UpdateVariantPayload }) =>
      adminService.updateVariant(productId, variantId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
};

export const useDeleteVariant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, variantId }: { productId: string; variantId: string }) =>
      adminService.deleteVariant(productId, variantId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
};

// ── Categorías ────────────────────────────────────────────────────────────────

export const useAdminCategories = () =>
  useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminService.getCategories(),
  });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => adminService.createCategory(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      qc.invalidateQueries({ queryKey: ['catalog', 'categories'] });
    },
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryPayload }) =>
      adminService.updateCategory(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      qc.invalidateQueries({ queryKey: ['catalog', 'categories'] });
    },
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      qc.invalidateQueries({ queryKey: ['catalog', 'categories'] });
    },
  });
};

// ── Cupones ───────────────────────────────────────────────────────────────────

export const useAdminCoupons = (page = 1, limit = 20) =>
  useQuery({
    queryKey: ['admin', 'coupons', page, limit],
    queryFn: () => adminService.getCoupons(page, limit),
  });

// ── Promociones Automáticas ──────────────────────────────────────────────────

export const useAdminPromotions = (query: PromotionListQuery = {}) =>
  useQuery({
    queryKey: ['admin', 'promotions', query],
    queryFn: () => adminService.getPromotions(query),
  });

export const useAdminPromotionById = (id: string | null) =>
  useQuery({
    queryKey: ['admin', 'promotion', id],
    queryFn: () => adminService.getPromotionById(id!),
    enabled: !!id,
  });

export const useCreatePromotion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePromotionPayload) => adminService.createPromotion(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'promotions'] }),
  });
};

export const useUpdatePromotion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePromotionPayload }) =>
      adminService.updatePromotion(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'promotions'] }),
  });
};

export const useTogglePromotion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.togglePromotion(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'promotions'] }),
  });
};

export const useDeletePromotion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.deletePromotion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'promotions'] }),
  });
};

// ── Cupones ───────────────────────────────────────────────────────────────────

export const useCreateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCouponPayload) => adminService.createCoupon(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  });
};

export const useToggleCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.toggleCoupon(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  });
};

// ── Banners ─────────────────────────────────────────────────────────────────

export const useAdminBanners = (params?: { type?: string; isActive?: boolean }) =>
  useQuery({
    queryKey: ['admin', 'banners', params],
    queryFn: () => adminService.getBanners(params),
  });

export const useCreateBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBannerPayload) => adminService.createBanner(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'banners'] }),
  });
};

export const useUpdateBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBannerPayload }) =>
      adminService.updateBanner(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'banners'] }),
  });
};

export const useToggleBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.toggleBanner(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'banners'] }),
  });
};

export const useDeleteBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteBanner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'banners'] }),
  });
};

// ── Analítica ────────────────────────────────────────────────────────────────

export const useAnalyticsSummary = (params?: AnalyticsQuery) =>
  useQuery({
    queryKey: ['admin', 'analytics', 'summary', params],
    queryFn: () => adminService.getAnalyticsSummary(params),
    staleTime: 2 * 60 * 1000,
  });

export const useAnalyticsVisits = (params?: AnalyticsQuery) =>
  useQuery({
    queryKey: ['admin', 'analytics', 'visits', params],
    queryFn: () => adminService.getAnalyticsVisits(params),
    staleTime: 2 * 60 * 1000,
  });

export const useAnalyticsRevenue = (params?: AnalyticsQuery) =>
  useQuery({
    queryKey: ['admin', 'analytics', 'revenue', params],
    queryFn: () => adminService.getAnalyticsRevenue(params),
    staleTime: 2 * 60 * 1000,
  });

export const useAnalyticsTopProducts = (params?: AnalyticsQuery) =>
  useQuery({
    queryKey: ['admin', 'analytics', 'top-products', params],
    queryFn: () => adminService.getAnalyticsTopProducts(params),
    staleTime: 2 * 60 * 1000,
  });

export const useAnalyticsTopCategories = (params?: AnalyticsQuery) =>
  useQuery({
    queryKey: ['admin', 'analytics', 'top-categories', params],
    queryFn: () => adminService.getAnalyticsTopCategories(params),
    staleTime: 2 * 60 * 1000,
  });

export const useAnalyticsSearches = (params?: AnalyticsQuery) =>
  useQuery({
    queryKey: ['admin', 'analytics', 'searches', params],
    queryFn: () => adminService.getAnalyticsSearches(params),
    staleTime: 2 * 60 * 1000,
  });

export const useAnalyticsFunnel = (params?: AnalyticsQuery) =>
  useQuery({
    queryKey: ['admin', 'analytics', 'funnel', params],
    queryFn: () => adminService.getAnalyticsFunnel(params),
    staleTime: 2 * 60 * 1000,
  });
