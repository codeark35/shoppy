import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analytics.service';
import type { DateRange } from '../types/analytics.types';

export const useAnalyticsOverview = (range?: DateRange) =>
  useQuery({
    queryKey: ['analytics', 'overview', range],
    queryFn: () => analyticsService.getOverview(range),
    staleTime: 5 * 60 * 1000,
  });

export const useAnalyticsSales = (range?: DateRange) =>
  useQuery({
    queryKey: ['analytics', 'sales', range],
    queryFn: () => analyticsService.getSalesByDay(range),
    staleTime: 5 * 60 * 1000,
  });

export const useAnalyticsTopProducts = (range?: DateRange, limit = 10) =>
  useQuery({
    queryKey: ['analytics', 'top-products', range, limit],
    queryFn: () => analyticsService.getTopProducts(range, limit),
    staleTime: 5 * 60 * 1000,
  });

export const useAnalyticsCustomers = (range?: DateRange) =>
  useQuery({
    queryKey: ['analytics', 'customers', range],
    queryFn: () => analyticsService.getCustomers(range),
    staleTime: 5 * 60 * 1000,
  });
