import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@libs/prisma';
import { CreateShippingZoneDto, CreateShippingRateDto } from './dto/shipping.dto';

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Zonas y tarifas públicas ─────────────────────────────────────────────

  async getZones() {
    return this.prisma.shippingZone.findMany({
      where: { isActive: true },
      include: {
        rates: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getRatesForDepartment(department: string) {
    // Buscar zonas que incluyan este departamento
    const zones = await this.prisma.shippingZone.findMany({
      where: {
        isActive: true,
        departments: { has: department },
      },
      include: {
        rates: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
        },
      },
    });

    // Si no hay zona específica, buscar zona comodín (array vacío = aplica a todo)
    if (zones.length === 0) {
      const fallback = await this.prisma.shippingZone.findMany({
        where: {
          isActive: true,
          departments: { isEmpty: true },
        },
        include: {
          rates: {
            where: { isActive: true },
            orderBy: { price: 'asc' },
          },
        },
      });
      return fallback.flatMap((z) => z.rates.map((r) => ({ ...r, zoneName: z.name })));
    }

    return zones.flatMap((z) => z.rates.map((r) => ({ ...r, zoneName: z.name })));
  }

  async getRateById(rateId: string) {
    const rate = await this.prisma.shippingRate.findUnique({
      where: { id: rateId },
    });
    if (!rate) throw new NotFoundException('Tarifa de envío no encontrada');
    return rate;
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  async createZone(dto: CreateShippingZoneDto) {
    return this.prisma.shippingZone.create({ data: dto });
  }

  async createRate(dto: CreateShippingRateDto) {
    const { zoneId, ...data } = dto;
    return this.prisma.shippingRate.create({
      data: { ...data, zone: { connect: { id: zoneId } } },
    });
  }

  async toggleZone(id: string, isActive: boolean) {
    return this.prisma.shippingZone.update({ where: { id }, data: { isActive } });
  }

  async toggleRate(id: string, isActive: boolean) {
    return this.prisma.shippingRate.update({ where: { id }, data: { isActive } });
  }
}
