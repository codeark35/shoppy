import React from 'react';
import { Button } from 'react-bootstrap';

interface Props {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** Nodo personalizado de acción. Tiene precedencia sobre actionLabel + onAction. */
  action?: React.ReactNode;
  /** Texto del botón de acción (requiere onAction). */
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, action, actionLabel, onAction }: Props) {
  return (
    <div className="text-center py-5">
      {icon && <div className="text-muted mb-3">{icon}</div>}
      <h6 className="fw-semibold text-muted mb-2">{title}</h6>
      {description && <p className="text-muted small mb-0">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
      {!action && actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
