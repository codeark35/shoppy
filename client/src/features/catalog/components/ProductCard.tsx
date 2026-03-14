import { Heart, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../../shared/utils/formatPrice';
import { useCartStore } from '../../cart/store/cartStore';
import { useWishlist } from '../../wishlist/hooks/useWishlist';
import type { Product } from '../types/catalog.types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const firstImage = product.images?.[0];
  const firstVariant = product.variants?.[0];
  const isInStock = product.variants.some((v) => v.stock > 0);
  const inWishlist = isInWishlist(product.id);

  const basePrice = Number(product.basePrice);
  const currentPrice = firstVariant ? Number(firstVariant.price) : basePrice;
  const discountPct =
    basePrice > 0 && currentPrice < basePrice
      ? Math.round(((basePrice - currentPrice) / basePrice) * 100)
      : 0;

  const handleAddToCart = () => {
    if (firstVariant) {
      addItem({
        variantId: firstVariant.id,
        sku: firstVariant.sku,
        name: product.name,
        imageUrl: firstImage?.url ?? null,
        price: currentPrice,
        quantity: 1,
        attributes: firstVariant.attributes,
      });
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div className="product-card">
      {/* Imagen + info — link a detalle del producto */}
      <Link to={`/productos/${product.slug}`} className="text-decoration-none d-flex flex-column flex-grow-1">
        <div className="product-card__image-wrapper">
          {/* siempre renderizar <img>: si src='' el ::before de CSS muestra el placeholder */}
          <img
            src={firstImage?.url ?? ''}
            alt={firstImage?.alt ?? product.name}
            loading="lazy"
            decoding="async"
          />

          {discountPct > 0 && (
            <span className="product-card__discount-badge">-{discountPct}%</span>
          )}

          {/* Wishlist — dentro del image-wrapper para el posicionamiento, con stopPropagation */}
          <button
            className={`product-card__wishlist-btn${inWishlist ? ' active' : ''}`}
            onClick={handleWishlist}
            aria-label={inWishlist ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          >
            <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="product-card__body">
          {product.category && (
            <span className="product-card__category">{product.category.name}</span>
          )}
          <h3 className="product-card__name">{product.name}</h3>
          <div className="product-card__pricing">
            <span className="product-card__price">{formatPrice(currentPrice)}</span>
            {discountPct > 0 && (
              <span className="product-card__price-original">{formatPrice(basePrice)}</span>
            )}
          </div>
        </div>
      </Link>

      {/* CTA — fuera del Link para no tener elementos interactivos anidados */}
      <div className="px-3 pb-3">
        {isInStock ? (
          <button
            className="btn btn-accent w-100 product-card__cta"
            onClick={handleAddToCart}
          >
            <ShoppingCart size={15} /> Agregar al carrito
          </button>
        ) : (
          <span className="badge bg-secondary w-100 d-block text-center py-2" style={{ borderRadius: 7 }}>
            Sin stock
          </span>
        )}
      </div>
    </div>
  );
}

  
