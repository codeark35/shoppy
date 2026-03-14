interface StarRatingProps {
  value: number;           // 1-5
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
}

export function StarRating({ value, onChange, size = 20, readonly = false }: StarRatingProps) {
  return (
    <div className="star-rating" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-rating__star${star <= value ? ' filled' : ''}`}
          style={{ fontSize: size, cursor: readonly ? 'default' : 'pointer' }}
          onClick={() => !readonly && onChange?.(star)}
          aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
          disabled={readonly}
        >
          ★
        </button>
      ))}
    </div>
  );
}
