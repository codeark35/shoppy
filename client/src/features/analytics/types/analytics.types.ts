export interface SalesOverview {
  totalRevenue: number;
  totalOrders: number;
  newCustomers: number;
  avgOrderValue: number;
}

export interface SalesByDay {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  sku: string;
  name: string;
  totalSold: number;
  totalOrders: number;
}

export interface CustomerReport {
  newCustomers: number;
  totalOrdersInPeriod: number;
  uniqueCustomersWithOrders: number;
}

export interface DateRange {
  from?: string;
  to?: string;
}

// ── Analytics de comportamiento (nuevo módulo) ───────────────────────────────

export type AnalyticsEventType =
  | 'PAGE_VIEW'
  | 'PRODUCT_VIEW'
  | 'CATEGORY_VIEW'
  | 'SEARCH'
  | 'ADD_TO_CART'
  | 'REMOVE_FROM_CART'
  | 'CHECKOUT_START'
  | 'PURCHASE'
  | 'BANNER_CLICK';

export type AnalyticsPeriod = 'today' | 'week' | 'month' | 'year';

export interface AnalyticsQuery {
  period?: AnalyticsPeriod;
  from?: string;
  to?: string;
  limit?: number;
}

export interface AnalyticsSummary {
  pageViews: number;
  productViews: number;
  uniqueSessions: number;
  searches: number;
  addToCarts: number;
  purchases: number;
  revenue: number;
  conversionRate: number;
  period: { from: string; to: string };
}

export interface TimeSeriesPoint {
  date: string;
  count?: number;
  revenue?: number;
  purchases?: number;
}

export interface AnalyticsTopProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  views: number;
  images: { url: string }[];
}

export interface AnalyticsTopCategory {
  id: string;
  name: string;
  slug: string;
  views: number;
}

export interface TopSearch {
  query: string;
  count: number;
}

export interface FunnelStep {
  label: string;
  count: number;
  pct: number;
  color: string;
}
