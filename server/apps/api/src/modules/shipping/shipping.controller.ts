import {
  Controller, Get, Post, Patch, Query, Param, Body, UseGuards,
} from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { CreateShippingZoneDto, CreateShippingRateDto, GetRatesQueryDto, ToggleActiveDto } from './dto/shipping.dto';
import { JwtAuthGuard, RolesGuard, Roles } from '@libs/common';
import { Role } from '@prisma/client';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  /** GET /shipping/zones — zonas con tarifas activas */
  @Get('zones')
  getZones() {
    return this.shippingService.getZones();
  }

  /** GET /shipping/rates?department=Central */
  @Get('rates')
  getRates(@Query() query: GetRatesQueryDto) {
    return this.shippingService.getRatesForDepartment(query.department ?? '');
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  @Post('zones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createZone(@Body() dto: CreateShippingZoneDto) {
    return this.shippingService.createZone(dto);
  }

  @Post('rates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createRate(@Body() dto: CreateShippingRateDto) {
    return this.shippingService.createRate(dto);
  }

  @Patch('zones/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  toggleZone(@Param('id') id: string, @Body() dto: ToggleActiveDto) {
    return this.shippingService.toggleZone(id, dto.isActive);
  }

  @Patch('rates/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  toggleRate(@Param('id') id: string, @Body() dto: ToggleActiveDto) {
    return this.shippingService.toggleRate(id, dto.isActive);
  }
}
