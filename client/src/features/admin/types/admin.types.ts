import type { OrderStatus } from '../../orders/types/orders.types';

export interface AdminOrderUser {
  id: string;
  name: string;
  email: string;
}

export interface AdminOrderItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  user: AdminOrderUser;
  items: AdminOrderItem[];
  payment?: { status: string; confirmedAt?: string; amount: number };
  shipping?: { trackingNumber?: string; city: string };
}

export interface AdminInventoryVariant {
  id: string;
  sku: string;
  stock: number;
  price: number;
  attributes: Record<string, string>;
  product: {
    id: string;
    name: string;
    slug: string;
    images: Array<{ url: string }>;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  createdAt: string;
  _count?: { orders: number };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

export type AdminOrderQuery = {
  page?: number;
  limit?: number;
  status?: OrderStatus;
};

// ── Productos ─────────────────────────────────────────────────────────────────

export interface AdminProductImage {
  id: string;
  url: string;
  position: number;
}

export interface AdminProductVariant {
  id: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  isActive: boolean;
  createdAt: string;
  category: { id: string; name: string; slug: string };
  images: AdminProductImage[];
  variants: AdminProductVariant[];
}

export type AdminProductsQuery = {
  search?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
  includeInactive?: boolean;
};

export type CreateProductPayload = {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  categoryId: string;
  isActive?: boolean;
};

export type UpdateProductPayload = Partial<CreateProductPayload>;

export type AddProductImagePayload = {
  url: string;
  alt?: string;
  position?: number;
};

export type CreateVariantPayload = {
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
};

// ── Categorías ────────────────────────────────────────────────────────────────

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children?: AdminCategory[];
}

export type CreateCategoryPayload = {
  name: string;
  slug: string;
  parentId?: string;
};

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

// ── Cupones / Promociones ────────────────────────────────────────────────────

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface AdminCoupon {
  id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchaseAmount?: number;
  maxUses?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

export type CreateCouponPayload = {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchaseAmount?: number;
  maxUses?: number;
  validFrom: string;
  validUntil: string;
};
