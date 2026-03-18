import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import {
  CreateCouponDto,
  ValidateCouponDto,
  CreatePromotionDto,
  UpdatePromotionDto,
  PromotionListQueryDto,
  PreviewPromotionsDto,
} from './dto/promotions.dto';
import { JwtAuthGuard, RolesGuard, Roles } from '@libs/common';
import { Role } from '@prisma/client';
import { ToggleActiveDto } from '../shipping/dto/shipping.dto';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  /** POST /promotions/preview — preview de precio con promos automáticas + cupón (público) */
  @Post('preview')
  previewPricing(@Body() dto: PreviewPromotionsDto) {
    return this.promotionsService.calculatePricing(dto.items, {
      couponCode: dto.couponCode,
      strategy: dto.strategy,
    });
  }

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
  listCoupons(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.promotionsService.listCoupons(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
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

  @Get('automatic')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  listPromotions(@Query() query: PromotionListQueryDto) {
    return this.promotionsService.listPromotions(query);
  }

  @Get('automatic/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getPromotionById(@Param('id') id: string) {
    return this.promotionsService.getPromotionById(id);
  }

  @Post('automatic')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createPromotion(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.createPromotion(dto);
  }

  @Patch('automatic/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updatePromotion(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotionsService.updatePromotion(id, dto);
  }

  @Patch('automatic/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  togglePromotion(@Param('id') id: string, @Body() dto: ToggleActiveDto) {
    return this.promotionsService.togglePromotion(id, dto.isActive);
  }

  @Delete('automatic/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  deletePromotion(@Param('id') id: string) {
    return this.promotionsService.deletePromotion(id);
  }

  @Post('automatic/preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  previewPromotions(@Body() dto: PreviewPromotionsDto) {
    return this.promotionsService.calculatePricing(dto.items, {
      couponCode: dto.couponCode,
      strategy: dto.strategy,
    });
  }
}
