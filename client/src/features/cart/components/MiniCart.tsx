import { Button, Badge } from 'react-bootstrap';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export function MiniCart() {
  const { cart, openCart } = useCartStore();

  return (
    <Button
      variant="outline-primary"
      className="position-relative"
      onClick={openCart}
      aria-label="Abrir carrito"
    >
      <ShoppingCart size={20} />
      {cart.itemCount > 0 && (
        <Badge
          bg="danger"
          pill
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            fontSize: '0.65rem',
            minWidth: '18px',
          }}
        >
          {cart.itemCount}
        </Badge>
      )}
    </Button>
  );
}
