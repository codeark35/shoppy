export interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: { url: string; alt: string | null }[];
    variants: { price: number | string }[];
  };
}
