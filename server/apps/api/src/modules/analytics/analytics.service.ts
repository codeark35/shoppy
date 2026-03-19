import { Injectable } from '@nestjs/common';
import { PrismaService } from '@libs/prisma';
import { AnalyticsEventType, Prisma } from '@prisma/client';
import { TrackEventDto, AnalyticsQueryDto } from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Rango de fechas ──────────────────────────────────────────────────────────

  private getDateRange(query: AnalyticsQueryDto): { from: Date; to: Date } {
    const now = new Date();
    const to = query.to ? new Date(query.to) : now;
    let from: Date;

    switch (query.period) {
      case 'today':
        from = new Date(now);
        from.setHours(0, 0, 0, 0);
        break;
      case 'week':
        from = new Date(now);
        from.setDate(now.getDate() - 7);
        break;
      case 'year':
        from = new Date(now);
        from.setFullYear(now.getFullYear() - 1);
        break;
      case 'month':
      default:
        from = query.from ? new Date(query.from) : new Date(now);
        if (!query.from) from.setDate(now.getDate() - 30);
    }

    return { from, to };
  }

  // ── Registrar evento ─────────────────────────────────────────────────────────

  async trackEvent(dto: TrackEventDto, userId?: string) {
    return this.prisma.analyticsEvent.create({
      data: {
        type: dto.type,
        sessionId: dto.sessionId,
        userId,
        productId: dto.productId,
        categoryId: dto.categoryId,
        bannerId: dto.bannerId,
        searchQuery: dto.searchQuery,
        page: dto.page,
        referrer: dto.referrer,
        value: dto.value,
        metadata: dto.metadata as Prisma.InputJsonObject,
      },
    });
  }

  // ── Resumen general ──────────────────────────────────────────────────────────

  async getSummary(query: AnalyticsQueryDto) {
    const { from, to } = this.getDateRange(query);
    const where = { createdAt: { gte: from, lte: to } };

    const [
      pageViews,
      productViews,
      searches,
      addToCarts,
      purchases,
      revenueAgg,
      sessionGroups,
    ] = await Promise.all([
      this.prisma.analyticsEvent.count({ where: { ...where, type: AnalyticsEventType.PAGE_VIEW } }),
      this.prisma.analyticsEvent.count({ where: { ...where, type: AnalyticsEventType.PRODUCT_VIEW } }),
      this.prisma.analyticsEvent.count({ where: { ...where, type: AnalyticsEventType.SEARCH } }),
      this.prisma.analyticsEvent.count({ where: { ...where, type: AnalyticsEventType.ADD_TO_CART } }),
      this.prisma.analyticsEvent.count({ where: { ...where, type: AnalyticsEventType.PURCHASE } }),
      this.prisma.analyticsEvent.aggregate({
        where: { ...where, type: AnalyticsEventType.PURCHASE },
        _sum: { value: true },
      }),
      this.prisma.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: { ...where, sessionId: { not: null } },
      }),
    ]);

    const uniqueSessions = sessionGroups.length;
    const revenue = revenueAgg._sum.value ?? 0;
    const conversionRate =
      uniqueSessions > 0 ? +((purchases / uniqueSessions) * 100).toFixed(2) : 0;

    return {
      pageViews,
      productViews,
      uniqueSessions,
      searches,
      addToCarts,
      purchases,
      revenue,
      conversionRate,
      period: { from, to },
    };
  }

  // ── Visitas por día ──────────────────────────────────────────────────────────

  async getVisitsOverTime(query: AnalyticsQueryDto) {
    const { from, to } = this.getDateRange(query);

    const rows: Array<{ date: Date; count: bigint }> = await this.prisma.$queryRaw`
      SELECT DATE_TRUNC('day', "createdAt") as date, COUNT(*) as count
      FROM "AnalyticsEvent"
      WHERE type = 'PAGE_VIEW'
        AND "createdAt" >= ${from}
        AND "createdAt" <= ${to}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `;

    return rows.map((r) => ({
      date: new Date(r.date).toISOString().slice(0, 10),
      count: Number(r.count),
    }));
  }

  // ── Revenue por día ──────────────────────────────────────────────────────────

  async getRevenueOverTime(query: AnalyticsQueryDto) {
    const { from, to } = this.getDateRange(query);

    const rows: Array<{ date: Date; revenue: number; purchases: bigint }> =
      await this.prisma.$queryRaw`
        SELECT DATE_TRUNC('day', "createdAt") as date,
               COALESCE(SUM(value), 0) as revenue,
               COUNT(*) as purchases
        FROM "AnalyticsEvent"
        WHERE type = 'PURCHASE'
          AND "createdAt" >= ${from}
          AND "createdAt" <= ${to}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY date ASC
      `;

    return rows.map((r) => ({
      date: new Date(r.date).toISOString().slice(0, 10),
      revenue: Number(r.revenue ?? 0),
      purchases: Number(r.purchases),
    }));
  }

  // ── Top productos más vistos ─────────────────────────────────────────────────

  async getTopProducts(query: AnalyticsQueryDto, limit = 10) {
    const { from, to } = this.getDateRange(query);

    const rows: Array<{ productId: string; count: bigint }> =
      await this.prisma.$queryRaw`
        SELECT "productId", COUNT(*) as count
        FROM "AnalyticsEvent"
        WHERE type = 'PRODUCT_VIEW'
          AND "productId" IS NOT NULL
          AND "createdAt" >= ${from}
          AND "createdAt" <= ${to}
        GROUP BY "productId"
        ORDER BY count DESC
        LIMIT ${limit}
      `;

    const ids = rows.map((r) => r.productId).filter(Boolean);
    if (!ids.length) return [];

    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        images: { take: 1, orderBy: { position: 'asc' }, select: { url: true } },
      },
    });

    const map = new Map(products.map((p) => [p.id, p]));
    return rows
      .filter((r) => map.has(r.productId))
      .map((r) => ({ ...map.get(r.productId), views: Number(r.count) }));
  }

  // ── Top categorías ───────────────────────────────────────────────────────────

  async getTopCategories(query: AnalyticsQueryDto, limit = 8) {
    const { from, to } = this.getDateRange(query);

    const rows: Array<{ categoryId: string; count: bigint }> =
      await this.prisma.$queryRaw`
        SELECT "categoryId", COUNT(*) as count
        FROM "AnalyticsEvent"
        WHERE type = 'CATEGORY_VIEW'
          AND "categoryId" IS NOT NULL
          AND "createdAt" >= ${from}
          AND "createdAt" <= ${to}
        GROUP BY "categoryId"
        ORDER BY count DESC
        LIMIT ${limit}
      `;

    const ids = rows.map((r) => r.categoryId).filter(Boolean);
    if (!ids.length) return [];

    const categories = await this.prisma.category.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, slug: true },
    });

    const map = new Map(categories.map((c) => [c.id, c]));
    return rows
      .filter((r) => map.has(r.categoryId))
      .map((r) => ({ ...map.get(r.categoryId), views: Number(r.count) }));
  }

  // ── Top búsquedas ────────────────────────────────────────────────────────────

  async getTopSearches(query: AnalyticsQueryDto, limit = 15) {
    const { from, to } = this.getDateRange(query);

    const rows: Array<{ searchQuery: string; count: bigint }> =
      await this.prisma.$queryRaw`
        SELECT "searchQuery", COUNT(*) as count
        FROM "AnalyticsEvent"
        WHERE type = 'SEARCH'
          AND "searchQuery" IS NOT NULL
          AND "searchQuery" != ''
          AND "createdAt" >= ${from}
          AND "createdAt" <= ${to}
        GROUP BY "searchQuery"
        ORDER BY count DESC
        LIMIT ${limit}
      `;

    return rows.map((r) => ({ query: r.searchQuery, count: Number(r.count) }));
  }

  // ── Funnel de conversión ─────────────────────────────────────────────────────

  async getConversionFunnel(query: AnalyticsQueryDto) {
    const { from, to } = this.getDateRange(query);
    const where = { createdAt: { gte: from, lte: to } };

    const [pageViews, productViews, addToCarts, checkouts, purchases] =
      await Promise.all([
        this.prisma.analyticsEvent.count({ where: { ...where, type: AnalyticsEventType.PAGE_VIEW } }),
        this.prisma.analyticsEvent.count({ where: { ...where, type: AnalyticsEventType.PRODUCT_VIEW } }),
        this.prisma.analyticsEvent.count({ where: { ...where, type: AnalyticsEventType.ADD_TO_CART } }),
        this.prisma.analyticsEvent.count({ where: { ...where, type: AnalyticsEventType.CHECKOUT_START } }),
        this.prisma.analyticsEvent.count({ where: { ...where, type: AnalyticsEventType.PURCHASE } }),
      ]);

    const base = pageViews || 1;
    return [
      { label: 'Visitas', count: pageViews, pct: 100, color: '#0F4C81' },
      { label: 'Vieron un producto', count: productViews, pct: +((productViews / base) * 100).toFixed(1), color: '#2E74B5' },
      { label: 'Agregaron al carrito', count: addToCarts, pct: +((addToCarts / base) * 100).toFixed(1), color: '#F97316' },
      { label: 'Iniciaron checkout', count: checkouts, pct: +((checkouts / base) * 100).toFixed(1), color: '#EA8800' },
      { label: 'Compraron', count: purchases, pct: +((purchases / base) * 100).toFixed(1), color: '#16A34A' },
    ];
  }

  // ── Eventos recientes ────────────────────────────────────────────────────────

  async getRecentEvents(limit = 50) {
    return this.prisma.analyticsEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        sessionId: true,
        page: true,
        searchQuery: true,
        productId: true,
        value: true,
        createdAt: true,
      },
    });
  }

  // ── Limpieza de eventos antiguos (cron) ──────────────────────────────────────

  async purgeOldEvents(daysToKeep = 365) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);
    const result = await this.prisma.analyticsEvent.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return { deleted: result.count };
  }
}
