import api from '../../../shared/lib/api';
import type {
  CustomerReport,
  DateRange,
  SalesByDay,
  SalesOverview,
  TopProduct,
} from '../types/analytics.types';

const buildParams = (range?: DateRange) => {
  const params: Record<string, string> = {};
  if (range?.from) params.from = range.from;
  if (range?.to) params.to = range.to;
  return params;
};

export const analyticsService = {
  getOverview: (range?: DateRange) =>
    api.get<SalesOverview>('/reports/overview', { params: buildParams(range) }).then((r) => r.data),

  getSalesByDay: (range?: DateRange) =>
    api
      .get<SalesByDay[]>('/reports/sales', { params: buildParams(range) })
      .then((r) => r.data),

  getTopProducts: (range?: DateRange, limit = 10) =>
    api
      .get<TopProduct[]>('/reports/top-products', {
        params: { ...buildParams(range), limit },
      })
      .then((r) => r.data),

  getCustomers: (range?: DateRange) =>
    api
      .get<CustomerReport>('/reports/customers', { params: buildParams(range) })
      .then((r) => r.data),

  downloadSalesCsv: (range?: DateRange) => {
    const params = new URLSearchParams(buildParams(range)).toString();
    window.open(`${api.defaults.baseURL}/reports/sales/csv?${params}`, '_blank');
  },

  downloadTopProductsCsv: (range?: DateRange, limit = 10) => {
    const params = new URLSearchParams({
      ...buildParams(range),
      limit: String(limit),
    }).toString();
    window.open(
      `${api.defaults.baseURL}/reports/top-products/csv?${params}`,
      '_blank',
    );
  },
};
