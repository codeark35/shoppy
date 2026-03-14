import api from '../../../shared/lib/api';
import type { WishlistItem } from '../types/wishlist.types';

export const wishlistService = {
  getWishlist: () =>
    api.get<WishlistItem[]>('/users/me/wishlist').then((r) => r.data),

  addToWishlist: (productId: string) =>
    api.post(`/users/me/wishlist/${productId}`).then((r) => r.data),

  removeFromWishlist: (productId: string) =>
    api.delete(`/users/me/wishlist/${productId}`).then((r) => r.data),
};
