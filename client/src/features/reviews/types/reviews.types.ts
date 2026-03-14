export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  user: { id: string; name: string };
}

export interface ReviewsResponse {
  reviews: Review[];
  averageRating: number;
  total: number;
}
