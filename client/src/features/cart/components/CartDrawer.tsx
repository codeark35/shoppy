import { Offcanvas, Button, ListGroup, Badge } from 'react-bootstrap';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { formatPrice } from '../../../shared/utils/formatPrice';

export function CartDrawer() {
  const { cart, isOpen, closeCart, updateItem, removeItem } = useCartStore();

  return (
    <Offcanvas show={isOpen} onHide={closeCart} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title className="d-flex align-items-center gap-2">
          <ShoppingCart size={20} />
          Tu carrito
          {cart.itemCount > 0 && (
            <Badge bg="primary" pill>{cart.itemCount}</Badge>
          )}
        </Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body className="d-flex flex-column">
        {cart.items.length === 0 ? (
          <div className="text-center text-muted py-5">
            <ShoppingCart size={48} className="mb-3 opacity-25" />
            <p>Tu carrito está vacío</p>
          </div>
        ) : (
          <>
            <ListGroup variant="flush" className="flex-grow-1">
              {cart.items.map((item) => (
                <ListGroup.Item key={item.variantId} className="px-0">
                  <div className="d-flex gap-2">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        width={56}
                        height={56}
                        style={{ objectFit: 'cover', borderRadius: 6 }}
                      />
                    )}
                    <div className="flex-grow-1">
                      <div className="fw-semibold small">{item.name}</div>
                      {Object.entries(item.attributes).map(([k, v]) => (
                        <span key={k} className="badge bg-light text-dark me-1 small">
                          {k}: {v}
                        </span>
                      ))}
                      <div className="d-flex align-items-center justify-content-between mt-1">
                        <div className="d-flex align-items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            className="p-1"
                            onClick={() => updateItem(item.variantId, item.quantity - 1)}
                          >
                            <Minus size={12} />
                          </Button>
                          <span className="px-2">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            className="p-1"
                            onClick={() => updateItem(item.variantId, item.quantity + 1)}
                          >
                            <Plus size={12} />
                          </Button>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold">{formatPrice(item.price * item.quantity)}</span>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            className="p-1"
                            onClick={() => removeItem(item.variantId)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>

            <div className="border-top pt-3 mt-2">
              <div className="d-flex justify-content-between fw-bold fs-5 mb-3">
                <span>Total</span>
                <span className="text-primary">{formatPrice(cart.total)}</span>
              </div>
              <Button
                href="/checkout"
                variant="primary"
                size="lg"
                className="w-100"
                onClick={closeCart}
              >
                Finalizar compra
              </Button>
            </div>
          </>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
}
