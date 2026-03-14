import api from '../../../shared/lib/api';
import type { Product, Category, ProductFilters } from '../types/catalog.types';
import type { PaginatedResult } from '../../../shared/types';

export const catalogService = {
  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResult<Product>> {
    const { data } = await api.get<PaginatedResult<Product>>('/catalog/products', {
      params: filters,
    });
    return data;
  },

  async getProductBySlug(slug: string): Promise<Product> {
    const { data } = await api.get<Product>(`/catalog/products/${slug}`);
    return data;
  },

  async getCategories(): Promise<Category[]> {
    const { data } = await api.get<Category[]>('/catalog/categories');
    return data;
  },
};
