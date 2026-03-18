import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@libs/prisma';
import { BannerType } from '@prisma/client';
import { CreateBannerDto, UpdateBannerDto, BannerQueryDto } from './dto/banners.dto';

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /banners (público) — solo activos y dentro del rango de fechas */
  async getActiveBanners(type?: BannerType) {
    const now = new Date();
    return this.prisma.banner.findMany({
      where: {
        isActive: true,
        type: type ?? undefined,
        OR: [{ validFrom: null }, { validFrom: { lte: now } }],
        AND: [
          { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
        ],
      },
      orderBy: { position: 'asc' },
    });
  }

  /** GET /admin/banners — todos */
  async findAll(query: BannerQueryDto) {
    return this.prisma.banner.findMany({
      where: {
        type: query.type ?? undefined,
        isActive: query.isActive ?? undefined,
      },
      orderBy: [{ type: 'asc' }, { position: 'asc' }],
    });
  }

  /** GET /admin/banners/:id */
  async findOne(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Banner no encontrado');
    return banner;
  }

  /** POST /admin/banners */
  async create(dto: CreateBannerDto) {
    return this.prisma.banner.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        imageUrl: dto.imageUrl,
        buttonText: dto.buttonText,
        buttonLink: dto.buttonLink,
        type: dto.type ?? BannerType.HERO,
        isActive: dto.isActive ?? true,
        position: dto.position ?? 0,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      },
    });
  }

  /** PATCH /admin/banners/:id */
  async update(id: string, dto: UpdateBannerDto) {
    await this.findOne(id);
    return this.prisma.banner.update({
      where: { id },
      data: {
        ...dto,
        validFrom: dto.validFrom !== undefined ? (dto.validFrom ? new Date(dto.validFrom) : null) : undefined,
        validUntil: dto.validUntil !== undefined ? (dto.validUntil ? new Date(dto.validUntil) : null) : undefined,
      },
    });
  }

  /** PATCH /admin/banners/:id/toggle */
  async toggle(id: string, isActive: boolean) {
    await this.findOne(id);
    return this.prisma.banner.update({ where: { id }, data: { isActive } });
  }

  /** PUT /admin/banners/reorder — actualiza position de varios banners */
  async reorder(items: { id: string; position: number }[]) {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.banner.update({ where: { id: item.id }, data: { position: item.position } }),
      ),
    );
    return { success: true };
  }

  /** DELETE /admin/banners/:id */
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.banner.delete({ where: { id } });
    return { success: true };
  }
}
