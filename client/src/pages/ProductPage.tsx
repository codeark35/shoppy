import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { ShoppingCart } from 'lucide-react';
import { AppNavbar } from '../shared/components/AppNavbar';
import { BottomNav } from '../shared/components/BottomNav';
import { useProductDetail } from '../features/catalog/hooks/useProducts';
import { useCartStore } from '../features/cart/store/cartStore';
import { formatPrice } from '../shared/utils/formatPrice';

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, isError } = useProductDetail(slug!);
  const { addItem } = useCartStore();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5 text-center"><Spinner /></Container>
      </>
    );
  }

  if (isError || !product) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5">
          <Alert variant="danger">Producto no encontrado.</Alert>
        </Container>
      </>
    );
  }

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId)
    ?? product.variants[0];

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addItem({
      variantId: selectedVariant.id,
      sku: selectedVariant.sku,
      name: product.name,
      imageUrl: product.images[0]?.url ?? null,
      price: Number(selectedVariant.price),
      quantity: 1,
      attributes: selectedVariant.attributes,
    });
  };

  return (
    <>
      <AppNavbar />
      <Container className="py-4">
        <Row>
          <Col md={6}>
            {product.images[0] ? (
              <img
                src={product.images[0].url}
                alt={product.name}
                className="img-fluid rounded shadow-sm"
              />
            ) : (
              <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ height: 400 }}>
                <span className="text-muted">Sin imagen</span>
              </div>
            )}
          </Col>
          <Col md={6} className="mt-3 mt-md-0">
            <Badge bg="secondary" className="mb-2">{product.category.name}</Badge>
            <h1 className="fs-3 fw-bold">{product.name}</h1>
            <p className="text-primary fs-4 fw-bold">{formatPrice(selectedVariant?.price ?? product.basePrice)}</p>
            <p className="text-muted">{product.description}</p>

            {product.variants.length > 1 && (
              <div className="mb-3">
                <strong>Variantes:</strong>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {product.variants.map((v) => (
                    <Button
                      key={v.id}
                      variant={v.id === (selectedVariantId ?? product.variants[0]?.id) ? 'primary' : 'outline-secondary'}
                      size="sm"
                      disabled={v.stock === 0}
                      onClick={() => setSelectedVariantId(v.id)}
                    >
                      {Object.values(v.attributes).join(' / ')}
                      {v.stock === 0 && ' (sin stock)'}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              className="w-100 d-flex align-items-center justify-content-center gap-2"
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stock === 0}
            >
              <ShoppingCart size={20} />
              {selectedVariant?.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
            </Button>
          </Col>
        </Row>
      </Container>
      <BottomNav />
    </>
  );
}
