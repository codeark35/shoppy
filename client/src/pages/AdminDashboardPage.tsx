import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { analyticsService, useAnalyticsCustomers, useAnalyticsOverview, useAnalyticsSales, useAnalyticsTopProducts } from '../features/analytics';
import { formatPrice } from '../shared/utils/formatPrice';
import type { DateRange } from '../features/analytics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const PERIOD_OPTIONS = [
  { label: 'Últimos 7 días', days: 7 },
  { label: 'Últimos 30 días', days: 30 },
  { label: 'Últimos 90 días', days: 90 },
];

function getRange(days: number): DateRange {
  const to = new Date();
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color: string;
}

function KpiCard({ title, value, subtitle, icon, color }: KpiCardProps) {
  return (
    <div className="col-12 col-sm-6 col-xl-3">
      <div className={`card border-0 shadow-sm h-100`}>
        <div className="card-body d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 56, height: 56, background: color + '18', fontSize: 24 }}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-muted small fw-medium">{title}</div>
            <div className="fs-4 fw-bold text-dark lh-1 mt-1">{value}</div>
            {subtitle && <div className="text-muted small mt-1">{subtitle}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [periodDays, setPeriodDays] = useState(30);
  const range = getRange(periodDays);

  const { data: overview, isLoading: loadingOverview } = useAnalyticsOverview(range);
  const { data: sales, isLoading: loadingSales } = useAnalyticsSales(range);
  const { data: topProducts, isLoading: loadingTop } = useAnalyticsTopProducts(range, 10);
  const { data: customers } = useAnalyticsCustomers(range);

  const salesChartData = {
    labels: sales?.map((s) => s.date) ?? [],
    datasets: [
      {
        label: 'Ingresos (₲)',
        data: sales?.map((s) => s.revenue) ?? [],
        borderColor: '#0F4C81',
        backgroundColor: '#0F4C8120',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
      },
    ],
  };

  const ordersChartData = {
    labels: sales?.map((s) => s.date) ?? [],
    datasets: [
      {
        label: 'Órdenes',
        data: sales?.map((s) => s.orders) ?? [],
        backgroundColor: '#F97316CC',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h4 fw-bold mb-0" style={{ fontFamily: 'Sora, sans-serif' }}>
            Dashboard
          </h1>
          <p className="text-muted small mb-0">Resumen de ventas y actividad</p>
        </div>

        {/* Selector de período */}
        <div className="btn-group">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              type="button"
              className={`btn btn-sm ${periodDays === opt.days ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setPeriodDays(opt.days)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      {loadingOverview ? (
        <div className="row g-3 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm" style={{ height: 88 }}>
                <div className="card-body">
                  <div className="skeleton rounded" style={{ height: 20, width: '60%' }} />
                  <div className="skeleton rounded mt-2" style={{ height: 28, width: '40%' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="row g-3 mb-4">
          <KpiCard
            title="Ingresos totales"
            value={formatPrice(overview?.totalRevenue ?? 0)}
            icon="💰"
            color="#0F4C81"
          />
          <KpiCard
            title="Órdenes"
            value={String(overview?.totalOrders ?? 0)}
            subtitle={`Promedio ${formatPrice(overview?.avgOrderValue ?? 0)}`}
            icon="📦"
            color="#F97316"
          />
          <KpiCard
            title="Nuevos clientes"
            value={String(customers?.newCustomers ?? overview?.newCustomers ?? 0)}
            icon="👤"
            color="#10B981"
          />
          <KpiCard
            title="Clientes activos"
            value={String(customers?.uniqueCustomersWithOrders ?? '—')}
            subtitle="Con al menos 1 orden"
            icon="🔁"
            color="#8B5CF6"
          />
        </div>
      )}

      {/* Charts */}
      <div className="row g-3 mb-4">
        {/* Ingresos por día */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="fw-semibold mb-0">Ingresos por día</h6>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => analyticsService.downloadSalesCsv(range)}
                >
                  ⬇ CSV
                </button>
              </div>
              {loadingSales ? (
                <div className="skeleton rounded" style={{ height: 240 }} />
              ) : (
                <Line data={salesChartData} options={chartOptions} height={100} />
              )}
            </div>
          </div>
        </div>

        {/* Órdenes por día */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Órdenes por día</h6>
              {loadingSales ? (
                <div className="skeleton rounded" style={{ height: 240 }} />
              ) : (
                <Bar data={ordersChartData} options={chartOptions} height={200} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h6 className="fw-semibold mb-0">Productos más vendidos</h6>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => analyticsService.downloadTopProductsCsv(range)}
            >
              ⬇ CSV
            </button>
          </div>

          {loadingTop ? (
            <div className="skeleton rounded" style={{ height: 200 }} />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Producto</th>
                    <th>SKU</th>
                    <th className="text-end">Unidades vendidas</th>
                    <th className="text-end">Órdenes</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts?.map((product, idx) => (
                    <tr key={product.sku}>
                      <td className="text-muted">{idx + 1}</td>
                      <td className="fw-medium">{product.name}</td>
                      <td>
                        <span className="badge bg-light text-dark font-monospace">
                          {product.sku}
                        </span>
                      </td>
                      <td className="text-end fw-bold">{product.totalSold}</td>
                      <td className="text-end text-muted">{product.totalOrders}</td>
                    </tr>
                  ))}
                  {!topProducts?.length && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        Sin datos para el período seleccionado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
