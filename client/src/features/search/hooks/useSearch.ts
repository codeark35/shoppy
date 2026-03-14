import { useQuery } from '@tanstack/react-query';
import { searchService } from '../services/search.service';
import type { SearchFilters } from '../types/search.types';

export const useSearch = (filters: SearchFilters, enabled = true) =>
  useQuery({
    queryKey: ['search', filters],
    queryFn: () => searchService.search(filters),
    enabled: enabled && filters.q.trim().length > 1,
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
