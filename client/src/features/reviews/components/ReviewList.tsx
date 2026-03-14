import { Spinner } from 'react-bootstrap';
import { StarRating } from './StarRating';
import type { Review } from '../types/reviews.types';

interface ReviewListProps {
  reviews: Review[];
  averageRating: number;
  total: number;
  isLoading: boolean;
}

export function ReviewList({ reviews, averageRating, total, isLoading }: ReviewListProps) {
  if (isLoading) return <Spinner animation="border" size="sm" />;

  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-3">
        <StarRating value={Math.round(averageRating)} readonly />
        <span className="fw-semibold">{averageRating.toFixed(1)}</span>
        <span className="text-muted">({total} reseña{total !== 1 ? 's' : ''})</span>
      </div>

      {reviews.length === 0 && (
        <p className="text-muted">Aún no hay reseñas para este producto.</p>
      )}

      {reviews.map((review) => (
        <div key={review.id} className="review-card mb-3">
          <div className="d-flex align-items-center gap-2 mb-1">
            <StarRating value={review.rating} readonly size={16} />
            <span className="fw-semibold small">{review.user.name}</span>
            <span className="text-muted small ms-auto">
              {new Date(review.createdAt).toLocaleDateString('es-PY')}
            </span>
          </div>
          {review.comment && <p className="mb-0 small">{review.comment}</p>}
        </div>
      ))}
    </div>
  );
}
