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
