import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards,
} from '@nestjs/common';
import { BannersService } from './banners.service';
import {
  CreateBannerDto, UpdateBannerDto, BannerQueryDto, ToggleBannerDto,
} from './dto/banners.dto';
import { JwtAuthGuard, RolesGuard, Roles } from '@libs/common';
import { Role, BannerType } from '@prisma/client';

@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  // ─── Público ────────────────────────────────────────────────────────────────

  /** GET /banners?type=HERO — banners activos para la tienda */
  @Get()
  getActive(@Query('type') type?: BannerType) {
    return this.bannersService.getActiveBanners(type);
  }

  // ─── Admin ────────────────────────────────────────────────────────────────────

  /** GET /banners/admin */
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll(@Query() query: BannerQueryDto) {
    return this.bannersService.findAll(query);
  }

  /** GET /banners/admin/:id */
  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.bannersService.findOne(id);
  }

  /** POST /banners/admin */
  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateBannerDto) {
    return this.bannersService.create(dto);
  }

  /** PATCH /banners/admin/:id */
  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.bannersService.update(id, dto);
  }

  /** PATCH /banners/admin/:id/toggle */
  @Patch('admin/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  toggle(@Param('id') id: string, @Body() dto: ToggleBannerDto) {
    return this.bannersService.toggle(id, dto.isActive);
  }

  /** POST /banners/admin/reorder */
  @Post('admin/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  reorder(@Body() body: { items: { id: string; position: number }[] }) {
    return this.bannersService.reorder(body.items);
  }

  /** DELETE /banners/admin/:id */
  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.bannersService.remove(id);
  }
}
