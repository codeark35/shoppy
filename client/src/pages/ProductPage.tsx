import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { ShoppingCart } from 'lucide-react';
import { AppNavbar } from '../shared/components/AppNavbar';
import { BottomNav } from '../shared/components/BottomNav';
import { AppFooter } from '../shared/components/AppFooter';
import { useProductDetail } from '../features/catalog/hooks/useProducts';
import { useCartStore } from '../features/cart/store/cartStore';
import { formatPrice } from '../shared/utils/formatPrice';
import { analyticsTracker } from '../features/analytics/services/analytics.tracker';

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, isError } = useProductDetail(slug!);
  const { addItem } = useCartStore();
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (product) analyticsTracker.trackProductView(product.id);
  }, [product?.id]);

  // Inicializar atributos desde la primera variante al cargar el producto
  useEffect(() => {
    if (product?.variants[0]?.attributes) {
      setSelectedAttrs({ ...product.variants[0].attributes });
    }
  }, [product?.id]);

  // Claves únicas de atributos en todas las variantes
  const attrKeys = useMemo(() => {
    if (!product) return [] as string[];
    const keys = new Set<string>();
    product.variants.forEach(v => Object.keys(v.attributes ?? {}).forEach(k => keys.add(k)));
    return Array.from(keys);
  }, [product]);

  // Valores únicos por clave de atributo
  const attrValues = useMemo(() => {
    if (!product) return {} as Record<string, string[]>;
    return attrKeys.reduce<Record<string, string[]>>((acc, key) => {
      acc[key] = [...new Set(
        product.variants.map(v => v.attributes?.[key]).filter((v): v is string => !!v)
      )];
      return acc;
    }, {});
  }, [attrKeys, product]);

  // Variante activa: coincidencia exacta de todos los atributos seleccionados
  const selectedVariant = useMemo(() => {
    if (!product) return undefined;
    if (!attrKeys.length) return product.variants[0];
    return (
      product.variants.find(v =>
        attrKeys.every(k => v.attributes[k] === selectedAttrs[k])
      ) ?? product.variants[0]
    );
  }, [product, selectedAttrs, attrKeys]);

  // Cálculo de precios y descuentos
  const pricing = useMemo(() => {
    if (!product) return null;
    const promo = product.activePromotion;
    const variantPrice = Number(selectedVariant?.price ?? product.basePrice);
    const basePrice = Number(product.basePrice);
    const promoPrice = promo
      ? promo.discountType === 'PERCENTAGE'
        ? Math.max(0, variantPrice * (1 - promo.discountValue / 100))
        : Math.max(0, variantPrice - promo.discountValue)
      : null;
    const currentPrice = promoPrice ?? variantPrice;
    const originalPrice = promoPrice !== null ? variantPrice : basePrice;
    const discountPct = promo
      ? promo.discountType === 'PERCENTAGE'
        ? promo.discountValue
        : Math.round(((variantPrice - currentPrice) / variantPrice) * 100)
      : basePrice > 0 && variantPrice < basePrice
      ? Math.round(((basePrice - variantPrice) / basePrice) * 100)
      : 0;
    return { promo, currentPrice, originalPrice, discountPct, hasDiscount: currentPrice < originalPrice };
  }, [product, selectedVariant]);

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

  // Seleccionar atributo: auto-completa el resto buscando la variante con mayor overlap
  const handleAttrSelect = (key: string, value: string) => {
    const newAttrs = { ...selectedAttrs, [key]: value };
    // Coincidencia exacta
    const exact = product.variants.find(v =>
      attrKeys.every(k => v.attributes[k] === newAttrs[k])
    );
    if (exact) { setSelectedAttrs({ ...exact.attributes }); return; }
    // Sin coincidencia exacta → buscar variante con este valor que tenga mayor overlap
    const candidates = product.variants.filter(v => v.attributes[key] === value);
    if (!candidates.length) { setSelectedAttrs(newAttrs); return; }
    if (candidates.length === 1) { setSelectedAttrs({ ...candidates[0].attributes }); return; }
    const best = candidates.reduce((acc, v) => {
      const score = attrKeys.filter(k => k !== key && v.attributes[k] === selectedAttrs[k]).length;
      const accScore = attrKeys.filter(k => k !== key && acc.attributes[k] === selectedAttrs[k]).length;
      return score > accScore ? v : acc;
    });
    setSelectedAttrs({ ...best.attributes });
  };

  const isValueAvailable = (key: string, value: string) =>
    product.variants.some(v => v.attributes[key] === value && v.stock > 0);

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    analyticsTracker.trackAddToCart(product.id);
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
            {product.images.length > 0 ? (
              <div>
                {/* Imagen principal */}
                <div
                  className="rounded shadow-sm overflow-hidden mb-2"
                  style={{ aspectRatio: '1/1', background: '#f8f9fa' }}
                >
                  <img
                    src={product.images[activeImageIndex]?.url}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                {/* Thumbnails */}
                {product.images.length > 1 && (
                  <div className="d-flex gap-2 flex-wrap">
                    {product.images.map((img, i) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImageIndex(i)}
                        style={{
                          width: 64,
                          height: 64,
                          padding: 0,
                          border: i === activeImageIndex ? '2px solid #1a3a5c' : '2px solid transparent',
                          borderRadius: 6,
                          overflow: 'hidden',
                          background: '#f8f9fa',
                          cursor: 'pointer',
                          flexShrink: 0,
                          outline: 'none',
                          opacity: i === activeImageIndex ? 1 : 0.65,
                          transition: 'opacity 0.15s, border-color 0.15s',
                        }}
                      >
                        <img
                          src={img.url}
                          alt={`${product.name} ${i + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/64x64?text=?'; }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ height: 400 }}>
                <span className="text-muted">Sin imagen</span>
              </div>
            )}
          </Col>
          <Col md={6} className="mt-3 mt-md-0">
            <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
              <Badge bg="secondary">{product.category.name}</Badge>
              {pricing?.promo && (
                <span className="product-card__promo-badge" title={pricing.promo.name}>
                  Oferta{pricing.discountPct > 0 ? ` −${pricing.discountPct}%` : ''}
                </span>
              )}
              {!pricing?.promo && pricing && pricing.discountPct > 0 && (
                <span className="product-card__discount-badge">−{pricing.discountPct}%</span>
              )}
            </div>
            <h1 className="fs-3 fw-bold">{product.name}</h1>
            <div className="d-flex align-items-baseline gap-2 mb-2">
              <span className="text-primary fs-4 fw-bold">
                {formatPrice(pricing?.currentPrice ?? product.basePrice)}
              </span>
              {pricing?.hasDiscount && (
                <span className="text-muted text-decoration-line-through fs-6">
                  {formatPrice(pricing.originalPrice)}
                </span>
              )}
            </div>
            <p className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>{product.description}</p>

            {product.variants.length > 0 && attrKeys.length > 0 && (
              <div className="mb-3">
                {attrKeys.map(key => (
                  <div key={key} className="mb-2">
                    <div className="small fw-semibold text-muted mb-1">
                      {key}:{' '}
                      <span className="text-dark">{selectedAttrs[key] ?? '—'}</span>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {attrValues[key].map(val => {
                        const available = isValueAvailable(key, val);
                        const active = selectedAttrs[key] === val;
                        return (
                          <Button
                            key={val}
                            size="sm"
                            variant={active ? 'primary' : 'outline-secondary'}
                            disabled={!available}
                            onClick={() => handleAttrSelect(key, val)}
                            style={{
                              opacity: available ? 1 : 0.4,
                              textDecoration: !available ? 'line-through' : undefined,
                              minWidth: 48,
                            }}
                          >
                            {val}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
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

        {/* ── Detalles técnicos ─────────────────────────────────────────── */}
        {product.details && (
          <Row className="mt-4">
            <Col xs={12}>
              <h5 className="fw-bold mb-3">Detalles y especificaciones</h5>
              <div
                className="rte-content p-3 bg-light rounded border"
                dangerouslySetInnerHTML={{ __html: product.details ?? '' }}
                style={{ fontSize: '0.93rem', lineHeight: 1.7 }}
              />
            </Col>
          </Row>
        )}

      </Container>
      <AppFooter />
      <BottomNav />
    </>
  );
}
