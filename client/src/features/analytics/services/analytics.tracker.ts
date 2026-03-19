import type { TrackEventPayload } from '../types/analytics.types';

const SESSION_KEY = '_sid';

function getSessionId(): string {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

function track(payload: Omit<TrackEventPayload, 'sessionId'>): void {
  const body: TrackEventPayload = { ...payload, sessionId: getSessionId() };

  // fire-and-forget — nunca bloquea ni propaga errores
  fetch('/api/v1/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {/* silencioso */});
}

export const analyticsTracker = {
  trackPageView(page: string) {
    track({ type: 'PAGE_VIEW', page, referrer: document.referrer || undefined });
  },
  trackProductView(productId: string, page?: string) {
    track({ type: 'PRODUCT_VIEW', productId, page });
  },
  trackCategoryView(categoryId: string) {
    track({ type: 'CATEGORY_VIEW', categoryId });
  },
  trackSearch(searchQuery: string) {
    track({ type: 'SEARCH', searchQuery });
  },
  trackAddToCart(productId: string) {
    track({ type: 'ADD_TO_CART', productId });
  },
  trackRemoveFromCart(productId: string) {
    track({ type: 'REMOVE_FROM_CART', productId });
  },
  trackCheckoutStart() {
    track({ type: 'CHECKOUT_START' });
  },
  trackPurchase(value: number) {
    track({ type: 'PURCHASE', value });
  },
  trackBannerClick(bannerId: string) {
    track({ type: 'BANNER_CLICK', bannerId });
  },
};
