import { useQuery } from '@tanstack/react-query';
import api from '../../../shared/lib/api';
import type { CartItem } from '../types/cart.types';

export type AppliedPricingItem = {
  variantId: string;
  promotionId: string;
  promotionName: string;
  discount: number;
  combinable: boolean;
};

export type PricingPreview = {
  strategy: string;
  scenario: 'AUTO_ONLY' | 'COUPON_ONLY' | 'AUTO_THEN_COUPON';
  subtotalBefore: number;
  automaticDiscount: number;
  couponDiscount: number;
  totalDiscount: number;
  subtotalAfter: number;
  appliedCouponId?: string;
  appliedCouponCode?: string;
  appliedItems?: AppliedPricingItem[];
};

export function useCartPricing(items: CartItem[], couponCode?: string) {
  return useQuery({
    queryKey: [
      'cart-pricing',
      items.map((i) => `${i.variantId}:${i.quantity}`).join(','),
      couponCode ?? '',
    ],
    queryFn: async () => {
      const res = await api.post<PricingPreview>('/promotions/preview', {
        items: items.map((i) => ({
          variantId: i.variantId,
          price: i.price,
          quantity: i.quantity,
        })),
        couponCode: couponCode || undefined,
      });
      return res.data;
    },
    enabled: items.length > 0,
    staleTime: 30_000,
    retry: false,
  });
}
