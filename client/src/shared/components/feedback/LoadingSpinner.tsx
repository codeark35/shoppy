import { Spinner } from 'react-bootstrap';

interface Props {
  text?: string;
  size?: 'sm';
  fullPage?: boolean;
}

export function LoadingSpinner({ text = 'Cargando...', size, fullPage = false }: Props) {
  return (
    <div
      className={`d-flex justify-content-center align-items-center gap-2 ${
        fullPage ? 'min-vh-100' : 'py-5'
      }`}
    >
      <Spinner animation="border" variant="primary" size={size} role="status" aria-hidden />
      <span className="text-muted">{text}</span>
    </div>
  );
}
