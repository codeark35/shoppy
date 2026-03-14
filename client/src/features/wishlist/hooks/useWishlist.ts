import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistService } from '../services/wishlist.service';
import { useAuthStore } from '../../auth/store/authStore';

export function useWishlist() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ['wishlist'],
    queryFn: wishlistService.getWishlist,
    enabled: !!user,
    staleTime: 60_000,
  });

  const wishlistIds = new Set(items.map((i) => i.productId));

  const addMutation = useMutation({
    mutationFn: (productId: string) => wishlistService.addToWishlist(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => wishlistService.removeFromWishlist(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  const toggleWishlist = (productId: string) => {
    if (!user) return;
    if (wishlistIds.has(productId)) {
      removeMutation.mutate(productId);
    } else {
      addMutation.mutate(productId);
    }
  };

  return {
    items,
    wishlistIds,
    toggleWishlist,
    isInWishlist: (productId: string) => wishlistIds.has(productId),
    isPending: addMutation.isPending || removeMutation.isPending,
  };
}
