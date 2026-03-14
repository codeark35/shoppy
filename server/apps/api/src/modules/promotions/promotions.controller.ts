import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { CreateCouponDto, ValidateCouponDto } from './dto/promotions.dto';
import { JwtAuthGuard, RolesGuard, Roles } from '@libs/common';
import { Role } from '@prisma/client';
import { ToggleActiveDto } from '../shipping/dto/shipping.dto';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  /** POST /promotions/validate — validar cupón en el carrito */
  @Post('validate')
  @UseGuards(JwtAuthGuard)
  validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.promotionsService.validateCoupon(dto);
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  @Get('coupons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  listCoupons() {
    return this.promotionsService.listCoupons();
  }

  @Post('coupons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.promotionsService.createCoupon(dto);
  }

  @Patch('coupons/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  toggleCoupon(@Param('id') id: string, @Body() dto: ToggleActiveDto) {
    return this.promotionsService.toggleCoupon(id, dto.isActive);
  }
}
