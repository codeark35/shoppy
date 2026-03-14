import { useState } from 'react';
import { Button, Form, Alert } from 'react-bootstrap';
import { StarRating } from './StarRating';

interface ReviewFormProps {
  productId: string;
  onSubmit: (data: { productId: string; rating: number; comment?: string }) => void;
  isSubmitting?: boolean;
  error?: Error | null;
}

export function ReviewForm({ productId, onSubmit, isSubmitting, error }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit({ productId, rating, comment: comment.trim() || undefined });
    setComment('');
    setRating(0);
  };

  return (
    <Form onSubmit={handleSubmit} className="mt-3">
      <p className="fw-semibold mb-2">Tu calificación</p>
      <StarRating value={rating} onChange={setRating} />
      {rating === 0 && (
        <p className="text-muted small mt-1">Seleccioná una puntuación</p>
      )}
      <Form.Control
        as="textarea"
        rows={3}
        className="mt-2"
        placeholder="Compartí tu opinión (opcional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
      />
      {error && (
        <Alert variant="danger" className="mt-2 py-1 small">
          {(error as any)?.response?.data?.message ?? 'No se pudo enviar la reseña'}
        </Alert>
      )}
      <Button
        type="submit"
        variant="primary"
        size="sm"
        className="mt-2"
        disabled={rating === 0 || isSubmitting}
      >
        {isSubmitting ? 'Enviando…' : 'Enviar reseña'}
      </Button>
    </Form>
  );
}
