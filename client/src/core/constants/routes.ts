// Constantes de rutas — usar en lugar de strings mágicos en Link, navigate, useNavigate, etc.
// Importar: import { ROUTES } from '../core/constants/routes';

export const ROUTES = {
  // ── Públicas ────────────────────────────────────────────────────────────────
  HOME:    '/',
  CATALOG: '/productos',
  PRODUCT: (slug: string) => `/productos/${slug}`,
  CART:    '/carrito',
  SEARCH:  '/buscar',
  LOGIN:   '/login',
  REGISTER: '/registro',

  // ── Protegidas (auth requerida) ──────────────────────────────────────────────
  CHECKOUT:        '/checkout',
  CHECKOUT_RESULT: '/checkout/result',
  ORDERS:          '/pedidos',
  ORDER_DETAIL:    (id: string) => `/pedidos/${id}`,
  ACCOUNT:         '/cuenta',
  WISHLIST:        '/favoritos',

  // ── Admin (rol ADMIN o WAREHOUSE) ────────────────────────────────────────────
  ADMIN: {
    ROOT:             '/admin',
    DASHBOARD:        '/admin/dashboard',
    ORDERS:           '/admin/ordenes',
    INVENTORY:        '/admin/inventario',
    PRODUCTS:         '/admin/productos',
    PRODUCT_NEW:      '/admin/productos/nuevo',
    PRODUCT_EDIT:     (id: string) => `/admin/productos/${id}/editar`,
    CATEGORIES:       '/admin/categorias',
    BANNERS:          '/admin/banners',
    ANALYTICS:        '/admin/analitica',
    PROMOTIONS:       '/admin/promociones',
    AUTO_PROMOTIONS:  '/admin/promociones-automaticas',
    USERS:            '/admin/usuarios',
    AUDIT:            '/admin/auditoria',
    ORPHANED_IMAGES:  '/admin/imagenes-huerfanas',
  },
} as const;
