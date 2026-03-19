import { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Spinner, Alert, Table, Badge,
} from 'react-bootstrap';
import {
  TrendingUp, Users, Search, ShoppingCart, CreditCard,
  DollarSign, BarChart2, Eye,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import {
  useAnalyticsSummary,
  useAnalyticsVisits,
  useAnalyticsRevenue,
  useAnalyticsTopProducts,
  useAnalyticsTopCategories,
  useAnalyticsSearches,
  useAnalyticsFunnel,
} from '../features/admin/hooks/useAdmin';
import type { AnalyticsPeriod, AnalyticsQuery } from '../features/analytics/types/analytics.types';
import './AdminAnalyticsPage.scss';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Tooltip, Legend, Filler,
);

// ── Tipos internos ────────────────────────────────────────────────────────────

type Period = AnalyticsPeriod;

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Hoy',
  week: 'Semana',
  month: 'Mes',
  year: 'Año',
};

// ── Componentes auxiliares ────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="kpi-card h-100 border-0 shadow-sm">
      <Card.Body className="d-flex align-items-center gap-3">
        <div className="kpi-card__icon" style={{ background: color + '20', color }}>
          <Icon size={22} />
        </div>
        <div>
          <div className="kpi-card__value">{value}</div>
          <div className="kpi-card__label">{label}</div>
          {sub && <div className="kpi-card__sub">{sub}</div>}
        </div>
      </Card.Body>
    </Card>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h6 className="analytics-section-title">{children}</h6>;
}

// ── Formateo ──────────────────────────────────────────────────────────────────

function fmtCurrency(v: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);
}
function fmtNum(v: number) {
  return new Intl.NumberFormat('es-AR').format(v);
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('month');
  const query: AnalyticsQuery = { period };

  const summary = useAnalyticsSummary(query);
  const visits   = useAnalyticsVisits(query);
  const revenue  = useAnalyticsRevenue(query);
  const topProds = useAnalyticsTopProducts(query);
  const topCats  = useAnalyticsTopCategories(query);
  const searches = useAnalyticsSearches(query);
  const funnel   = useAnalyticsFunnel(query);

  const isLoading = summary.isLoading || visits.isLoading;
  const hasError  = summary.isError   || visits.isError;

  // ── Datos para Chart.js ──────────────────────────────────────────────────

  const visitsData = {
    labels: (visits.data ?? []).map((d) => d.date?.slice(5) ?? ''),
    datasets: [{
      label: 'Visitas',
      data: (visits.data ?? []).map((d) => d.count ?? 0),
      borderColor: '#0F4C81',
      backgroundColor: 'rgba(15,76,129,0.08)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
    }],
  };

  const revenueData = {
    labels: (revenue.data ?? []).map((d) => d.date?.slice(5) ?? ''),
    datasets: [{
      label: 'Revenue (ARS)',
      data: (revenue.data ?? []).map((d) => d.revenue ?? 0),
      borderColor: '#16A34A',
      backgroundColor: 'rgba(22,163,74,0.08)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
    }],
  };

  const catsData = {
    labels: (topCats.data ?? []).map((c) => c.name),
    datasets: [{
      label: 'Visitas',
      data: (topCats.data ?? []).map((c) => c.views),
      backgroundColor: [
        '#0F4C81', '#2E74B5', '#5B9BD5', '#F97316',
        '#EA8800', '#16A34A', '#9333EA', '#DC2626',
      ],
      borderRadius: 4,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
    },
  };

  const barOptions = {
    ...chartOptions,
    indexAxis: 'y' as const,
    scales: {
      x: { beginAtZero: true, grid: { color: '#f1f5f9' } },
      y: { grid: { display: false } },
    },
  };

  const s = summary.data;

  return (
    <Container fluid className="admin-analytics py-4">
      {/* ── Encabezado ── */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="mb-0 fw-bold">Analítica</h4>
          <small className="text-muted">Comportamiento de usuarios y métricas de negocio</small>
        </div>
        <div className="period-selector">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              className={`period-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {hasError && (
        <Alert variant="warning">No se pudieron cargar algunos datos. Intentá de nuevo.</Alert>
      )}

      {/* ── KPI Cards ── */}
      {isLoading ? (
        <div className="text-center py-5"><Spinner /></div>
      ) : (
        <>
          <Row className="g-3 mb-4">
            <Col xs={12} sm={6} lg={3}>
              <KpiCard label="Visitas" value={fmtNum(s?.pageViews ?? 0)} icon={Eye} color="#0F4C81" />
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <KpiCard label="Sesiones únicas" value={fmtNum(s?.uniqueSessions ?? 0)} icon={Users} color="#2E74B5" />
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <KpiCard label="Búsquedas" value={fmtNum(s?.searches ?? 0)} icon={Search} color="#7C3AED" />
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <KpiCard label="Agregados al carrito" value={fmtNum(s?.addToCarts ?? 0)} icon={ShoppingCart} color="#F97316" />
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <KpiCard label="Compras" value={fmtNum(s?.purchases ?? 0)} icon={CreditCard} color="#16A34A" />
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <KpiCard label="Revenue" value={fmtCurrency(s?.revenue ?? 0)} icon={DollarSign} color="#16A34A" />
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <KpiCard label="Tasa de conversión" value={`${s?.conversionRate ?? 0}%`} icon={TrendingUp} color="#0F4C81" />
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <KpiCard label="Vistas de productos" value={fmtNum(s?.productViews ?? 0)} icon={BarChart2} color="#EA8800" />
            </Col>
          </Row>

          {/* ── Gráficos de tiempo ── */}
          <Row className="g-3 mb-4">
            <Col xs={12} lg={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <SectionTitle>Visitas por día</SectionTitle>
                  <div style={{ height: 220 }}>
                    {visits.data?.length ? (
                      <Line data={visitsData} options={chartOptions} />
                    ) : (
                      <div className="text-center text-muted pt-5">Sin datos para este período</div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} lg={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <SectionTitle>Revenue por día (ARS)</SectionTitle>
                  <div style={{ height: 220 }}>
                    {revenue.data?.length ? (
                      <Line data={revenueData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, tooltip: { callbacks: { label: (ctx) => fmtCurrency(ctx.raw as number) } } } }} />
                    ) : (
                      <div className="text-center text-muted pt-5">Sin datos para este período</div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* ── Funnel + Búsquedas ── */}
          <Row className="g-3 mb-4">
            <Col xs={12} lg={7}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <SectionTitle>Funnel de conversión</SectionTitle>
                  {funnel.isLoading ? (
                    <div className="text-center py-4"><Spinner size="sm" /></div>
                  ) : (
                    <div className="funnel">
                      {(funnel.data ?? []).map((step, i) => (
                        <div key={i} className="funnel-step">
                          <div className="funnel-bar-wrap">
                            <div
                              className="funnel-bar"
                              style={{ width: `${Math.max(step.pct, 1)}%`, background: step.color }}
                            />
                          </div>
                          <div className="funnel-info">
                            <span className="funnel-label">{step.label}</span>
                            <span className="funnel-meta">
                              <strong>{fmtNum(step.count)}</strong>
                              <Badge bg="light" text="dark" className="ms-2">{step.pct}%</Badge>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} lg={5}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <SectionTitle>Top búsquedas</SectionTitle>
                  {searches.isLoading ? (
                    <div className="text-center py-4"><Spinner size="sm" /></div>
                  ) : !searches.data?.length ? (
                    <div className="text-muted text-center pt-4">Sin búsquedas</div>
                  ) : (
                    <ol className="searches-list">
                      {(searches.data ?? []).map((s, i) => (
                        <li key={i} className="searches-list__item">
                          <span className="searches-list__query">{s.query}</span>
                          <Badge bg="secondary">{fmtNum(s.count)}</Badge>
                        </li>
                      ))}
                    </ol>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* ── Top Productos + Top Categorías ── */}
          <Row className="g-3">
            <Col xs={12} lg={7}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <SectionTitle>Productos más vistos</SectionTitle>
                  {topProds.isLoading ? (
                    <div className="text-center py-4"><Spinner size="sm" /></div>
                  ) : !topProds.data?.length ? (
                    <div className="text-muted text-center pt-4">Sin datos</div>
                  ) : (
                    <div className="table-responsive">
                      <Table hover size="sm" className="analytics-table mb-0">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Producto</th>
                            <th className="text-end">Precio</th>
                            <th className="text-end">Visitas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(topProds.data ?? []).map((p, i) => (
                            <tr key={p.id}>
                              <td className="text-muted">{i + 1}</td>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  {p.images?.[0]?.url ? (
                                    <img
                                      src={p.images[0].url}
                                      alt={p.name}
                                      className="product-thumb"
                                    />
                                  ) : (
                                    <div className="product-thumb product-thumb--empty" />
                                  )}
                                  <span className="fw-medium">{p.name}</span>
                                </div>
                              </td>
                              <td className="text-end text-muted">{fmtCurrency(p.basePrice)}</td>
                              <td className="text-end fw-semibold">{fmtNum(p.views)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} lg={5}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <SectionTitle>Categorías más visitadas</SectionTitle>
                  <div style={{ height: 280 }}>
                    {topCats.isLoading ? (
                      <div className="text-center py-5"><Spinner size="sm" /></div>
                    ) : topCats.data?.length ? (
                      <Bar data={catsData} options={barOptions} />
                    ) : (
                      <div className="text-center text-muted pt-5">Sin datos para este período</div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}
