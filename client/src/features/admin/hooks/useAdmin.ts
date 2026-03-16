import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import type {
  AdminOrderQuery,
  AdminProductsQuery,
  CreateProductPayload,
  UpdateProductPayload,
  CreateVariantPayload,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CreateCouponPayload,
} from '../types/admin.types';
import type { OrderStatus } from '../../orders/types/orders.types';

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

export const useAdminInventory = (lowStock = false) =>
  useQuery({
    queryKey: ['admin', 'inventory', lowStock],
    queryFn: () => adminService.getInventory(lowStock),
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

export const useAddVariant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: CreateVariantPayload }) =>
      adminService.addVariant(productId, payload),
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

export const useAdminCoupons = () =>
  useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: () => adminService.getCoupons(),
  });

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
