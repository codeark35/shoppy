import { useQuery } from '@tanstack/react-query';
import { bannersService } from '../services/banners.service';
import type { BannerType } from '../types/banner.types';

export function useBanners(type?: BannerType) {
  return useQuery({
    queryKey: ['banners', type],
    queryFn: () => bannersService.getActiveBanners(type),
    staleTime: 1000 * 60 * 5, // 5 min
  });
}
