import api from '../../../shared/lib/api';
import type { SearchFilters, SearchResult } from '../types/search.types';

export const searchService = {
  search: (filters: SearchFilters) => {
    const params: Record<string, string | number> = { q: filters.q };
    if (filters.categorySlug) params.categorySlug = filters.categorySlug;
    if (filters.minPrice != null) params.minPrice = filters.minPrice;
    if (filters.maxPrice != null) params.maxPrice = filters.maxPrice;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;

    return api.get<SearchResult>('/search', { params }).then((r) => r.data);
  },
};
