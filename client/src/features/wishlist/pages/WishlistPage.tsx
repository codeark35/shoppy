import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { AppNavbar } from '../../../shared/components/AppNavbar';
import { BottomNav } from '../../../shared/components/BottomNav';
import { AppFooter } from '../../../shared/components/AppFooter';
import { useWishlist } from '../hooks/useWishlist';
import { useCartStore } from '../../cart/store/cartStore';
import { formatPrice } from '../../../shared/utils/formatPrice';

export default function WishlistPage() {
  const { items, toggleWishlist, isPending } = useWishlist();
  const { addItem } = useCartStore();

  const handleAddToCart = (item: (typeof items)[number]) => {
    const variant = item.product.variants?.[0];
    const image = item.product.images?.[0];
    if (!variant) return;
    addItem({
      variantId: variant.id,
      sku: variant.sku,
      name: item.product.name,
      imageUrl: image?.url ?? null,
      price: Number(variant.price),
      quantity: 1,
      attributes: variant.attributes ?? {},
    });
  };

  return (
    <>
      <AppNavbar />
      <Container className="py-4 pb-5 mb-4">
        <h1 className="fs-3 fw-bold mb-4 d-flex align-items-center gap-2">
          <Heart size={24} className="text-danger" fill="currentColor" />
          Mis favoritos
          {items.length > 0 && (
            <span className="fs-6 fw-normal text-muted ms-1">({items.length})</span>
          )}
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-5">
            <Heart size={56} className="text-muted mb-3 opacity-25" />
            <h5 className="text-muted fw-semibold mb-2">No tenés productos favoritos</h5>
            <p className="text-muted small mb-4">
              Explorá el catálogo y guardá los productos que más te gusten.
            </p>
            <Button as={Link as any} to="/productos" variant="primary">
              Ver catálogo
            </Button>
          </div>
        ) : (
          <Row className="g-3">
            {items.map((item) => {
              const image = item.product.images?.[0];
              const variant = item.product.variants?.[0];
              const price = variant ? Number(variant.price) : null;

              return (
                <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
                  <Card className="h-100 shadow-sm border-0" style={{ borderRadius: 14 }}>
                    <Link to={`/productos/${item.product.slug}`} className="text-decoration-none">
                      <div style={{ aspectRatio: '1/1', background: '#F8FAFC', borderRadius: '14px 14px 0 0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {image ? (
                          <img src={image.url} alt={image.alt ?? item.product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 10 }} />
                        ) : (
                          <Heart size={40} className="text-muted opacity-25" />
                        )}
                      </div>
                    </Link>
                    <Card.Body className="d-flex flex-column pb-2">
                      <Link to={`/productos/${item.product.slug}`} className="text-decoration-none text-dark">
                        <p className="fw-semibold mb-1" style={{ fontSize: '0.88rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4, minHeight: '2.5em' }}>
                          {item.product.name}
                        </p>
                      </Link>
                      {price !== null && (
                        <p className="fw-bold mb-2" style={{ color: '#0F4C81', fontSize: '1.05rem' }}>
                          {formatPrice(price)}
                        </p>
                      )}
                      <div className="d-flex gap-2 mt-auto">
                        {variant ? (
                          <Button size="sm" variant="accent" className="btn-accent flex-grow-1 d-flex align-items-center justify-content-center gap-1" style={{ borderRadius: 9999, fontSize: '0.8rem' }} onClick={() => handleAddToCart(item)}>
                            <ShoppingCart size={14} /> Agregar
                          </Button>
                        ) : (
                          <span className="flex-grow-1 text-center text-muted small" style={{ padding: '6px 0' }}>Sin stock</span>
                        )}
                        <Button size="sm" variant="outline-danger" style={{ borderRadius: 9999, width: 36, padding: 0 }} onClick={() => toggleWishlist(item.productId)} disabled={isPending} title="Quitar de favoritos">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Container>
      <AppFooter />
      <BottomNav />
    </>
  );
}
