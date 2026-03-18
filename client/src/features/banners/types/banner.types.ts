export type BannerType = 'HERO' | 'PROMO';

export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  buttonText?: string | null;
  buttonLink?: string | null;
  type: BannerType;
  isActive: boolean;
  position: number;
  validFrom?: string | null;
  validUntil?: string | null;
}
