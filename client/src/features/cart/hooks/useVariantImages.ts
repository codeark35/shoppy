import { useQuery } from '@tanstack/react-query';
import api from '../../../shared/lib/api';

type VariantImage = {
  variantId: string;
  imageUrl: string | null;
};

export function useVariantImages(variantIds: string[]) {
  const ids = variantIds.join(',');
  return useQuery({
    queryKey: ['variant-images', ids],
    queryFn: async () => {
      const res = await api.get<VariantImage[]>(`/catalog/variant-images?ids=${ids}`);
      const map: Record<string, string | null> = {};
      res.data.forEach((v) => { map[v.variantId] = v.imageUrl; });
      return map;
    },
    enabled: variantIds.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
