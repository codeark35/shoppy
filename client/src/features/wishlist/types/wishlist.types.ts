export interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: { url: string; alt: string | null }[];
    variants: { id: string; sku: string; price: number | string; attributes: Record<string, string> }[];
  };
}
