import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles } from '@libs/common';
import { Role } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto, AnalyticsQueryDto } from './dto/analytics.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /** Público: registrar evento (fire-and-forget) */
  @Post('track')
  @HttpCode(HttpStatus.NO_CONTENT)
  async track(@Body() dto: TrackEventDto, @Request() req: any) {
    const userId = req.user?.id;
    this.analyticsService.trackEvent(dto, userId).catch(() => {/* silencioso */});
  }

  /** Público: categorías más visitadas (para la home) */
  @Get('popular-categories')
  getPopularCategories(@Query('limit') limit?: string) {
    return this.analyticsService.getTopCategories({}, limit ? Number(limit) : 8);
  }

  /** Admin: resumen general (KPIs) */
  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getSummary(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getSummary(query);
  }

  /** Admin: visitas por día */
  @Get('visits')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getVisits(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getVisitsOverTime(query);
  }

  /** Admin: revenue por día */
  @Get('revenue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getRevenue(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getRevenueOverTime(query);
  }

  /** Admin: productos más vistos */
  @Get('top-products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getTopProducts(@Query() query: AnalyticsQueryDto) {
    const limit = query.limit ? Number(query.limit) : 10;
    return this.analyticsService.getTopProducts(query, limit);
  }

  /** Admin: categorías más visitadas */
  @Get('top-categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getTopCategories(@Query() query: AnalyticsQueryDto) {
    const limit = query.limit ? Number(query.limit) : 8;
    return this.analyticsService.getTopCategories(query, limit);
  }

  /** Admin: términos de búsqueda más frecuentes */
  @Get('searches')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getTopSearches(@Query() query: AnalyticsQueryDto) {
    const limit = query.limit ? Number(query.limit) : 15;
    return this.analyticsService.getTopSearches(query, limit);
  }

  /** Admin: funnel de conversión */
  @Get('funnel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getFunnel(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getConversionFunnel(query);
  }

  /** Admin: eventos recientes */
  @Get('events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getRecentEvents(@Query('limit') limit?: string) {
    return this.analyticsService.getRecentEvents(limit ? Number(limit) : 50);
  }
}
