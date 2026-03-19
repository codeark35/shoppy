import { useQuery } from '@tanstack/react-query';
import { catalogService } from '../services/catalog.service';
import type { ProductFilters } from '../types/catalog.types';

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => catalogService.getProducts(filters),
    staleTime: 1000 * 60 * 15, // 15 min — coincide con caché del servidor
  });
}

export function useProductDetail(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => catalogService.getProductBySlug(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 15,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogService.getCategories(),
    staleTime: 1000 * 60 * 15,
  });
}

export function useFeaturedCategories() {
  return useQuery({
    queryKey: ['categories', 'featured'],
    queryFn: () => catalogService.getFeaturedCategories(),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePopularCategories(limit = 8) {
  return useQuery({
    queryKey: ['categories', 'popular', limit],
    queryFn: () => catalogService.getPopularCategories(limit),
    staleTime: 1000 * 60 * 5,
  });
}
