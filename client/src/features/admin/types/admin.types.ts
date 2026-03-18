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
  alt?: string;
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
  isFeatured: boolean;
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
  featured?: boolean;
};

export type CreateProductPayload = {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  categoryId: string;
  isActive?: boolean;
  isFeatured?: boolean;
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
  imageUrl?: string;
  parentId: string | null;
  isFeatured?: boolean;
  featuredPosition?: number;
  children?: AdminCategory[];
}

export type CreateCategoryPayload = {
  name: string;
  slug: string;
  parentId?: string;
  imageUrl?: string;
  isFeatured?: boolean;
  featuredPosition?: number;
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

// ── Promociones Automáticas ──────────────────────────────────────────────────

export type PromotionScope = 'PRODUCT' | 'CATEGORY';

export interface AdminPromotion {
  id: string;
  name: string;
  description?: string;
  scope: PromotionScope;
  discountType: DiscountType;
  discountValue: number;
  minPurchaseAmount?: number;
  priority: number;
  combinable: boolean;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
  createdAt: string;
  products: Array<{ productId: string; product: { id: string; name: string } }>;
  categories: Array<{ categoryId: string; category: { id: string; name: string } }>;
}

export type CreatePromotionPayload = {
  name: string;
  description?: string;
  scope: PromotionScope;
  discountType: DiscountType;
  discountValue: number;
  minPurchaseAmount?: number;
  priority?: number;
  combinable?: boolean;
  validFrom: string;
  validUntil?: string;
  isActive?: boolean;
  productIds?: string[];
  categoryIds?: string[];
};

export type UpdatePromotionPayload = Partial<CreatePromotionPayload>;

export type PromotionListQuery = {
  page?: number;
  limit?: number;
  isActive?: boolean;
  scope?: PromotionScope;
  search?: string;
};

// ── Banners ────────────────────────────────────────────────────────────────────

export type BannerType = 'HERO' | 'PROMO';

export interface AdminBanner {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  buttonText?: string | null;
  buttonLink?: string | null;
  type: BannerType;
  isActive: boolean;
  position: number;
  validFrom?: string | null;
  validUntil?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBannerPayload {
  title: string;
  subtitle?: string;
  imageUrl: string;
  buttonText?: string;
  buttonLink?: string;
  type?: BannerType;
  isActive?: boolean;
  position?: number;
  validFrom?: string;
  validUntil?: string;
}

export type UpdateBannerPayload = Partial<CreateBannerPayload>;
