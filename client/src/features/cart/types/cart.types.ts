export interface CartItem {
  variantId: string;
  sku: string;
  name: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
  attributes: Record<string, string>;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}
