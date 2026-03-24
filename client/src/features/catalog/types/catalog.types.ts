export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  coverImageUrl?: string;
  parentId?: string;
  isFeatured?: boolean;
  featuredPosition?: number;
  children?: Category[];
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  position: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  details?: string;
  basePrice: number;
  category: Pick<Category, 'id' | 'name' | 'slug'>;
  images: ProductImage[];
  variants: ProductVariant[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  activePromotion?: {
    name: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
  } | null;
}

export interface ProductFilters {
  search?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  featured?: boolean;
  onSale?: boolean;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'featured';
}
