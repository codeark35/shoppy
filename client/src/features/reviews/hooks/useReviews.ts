import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsService } from '../services/reviews.service';

export function useReviews(productId: string) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => reviewsService.getProductReviews(productId),
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: reviewsService.createReview,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews', productId] }),
  });

  return {
    reviews: data?.reviews ?? [],
    averageRating: data?.averageRating ?? 0,
    total: data?.total ?? 0,
    isLoading,
    createReview: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
  };
}
