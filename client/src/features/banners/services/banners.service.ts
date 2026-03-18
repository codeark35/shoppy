import api from '../../../shared/lib/api';
import type { Banner, BannerType } from '../types/banner.types';

export const bannersService = {
  getActiveBanners: (type?: BannerType): Promise<Banner[]> =>
    api.get<Banner[]>('/banners', { params: type ? { type } : {} }).then((r) => r.data),
};
