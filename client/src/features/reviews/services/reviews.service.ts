import api from '../../../shared/lib/api';
import type { ReviewsResponse } from '../types/reviews.types';

export const reviewsService = {
  getProductReviews: (productId: string) =>
    api.get<ReviewsResponse>(`/reviews/product/${productId}`).then((r) => r.data),

  createReview: (data: { productId: string; rating: number; comment?: string }) =>
    api.post('/reviews', data).then((r) => r.data),
};
