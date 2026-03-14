import type { PaginatedResult } from '../../../shared/types';
import type { Product } from '@/features/catalog';

export interface SearchFilters {
  q: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export type SearchResult = PaginatedResult<Product>;
