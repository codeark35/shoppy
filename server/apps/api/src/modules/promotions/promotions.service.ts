import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@libs/prisma';
import { DiscountType } from '@prisma/client';
import { CreateCouponDto, ValidateCouponDto } from './dto/promotions.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async validateCoupon(dto: ValidateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      throw new NotFoundException('Cupón no válido o inactivo');
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      throw new BadRequestException('El cupón ha expirado o aún no está vigente');
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('El cupón ha alcanzado el límite de usos');
    }

    const minAmount = coupon.minPurchaseAmount ? Number(coupon.minPurchaseAmount) : 0;
    if (dto.subtotal < minAmount) {
      throw new BadRequestException(
        `El monto mínimo para este cupón es ${minAmount.toLocaleString('es-PY')} Gs.`,
      );
    }

    let discount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discount = Math.round((dto.subtotal * Number(coupon.discountValue)) / 100);
    } else {
      discount = Math.min(Number(coupon.discountValue), dto.subtotal);
    }

    return {
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      discount,
      finalTotal: dto.subtotal - discount,
    };
  }

  async createCoupon(dto: CreateCouponDto) {
    return this.prisma.coupon.create({
      data: {
        ...dto,
        code: dto.code.toUpperCase(),
        discountValue: new Decimal(dto.discountValue),
        minPurchaseAmount: dto.minPurchaseAmount !== undefined
          ? new Decimal(dto.minPurchaseAmount)
          : undefined,
        validFrom: new Date(dto.validFrom),
        validUntil: new Date(dto.validUntil),
      },
    });
  }

  async listCoupons() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async toggleCoupon(id: string, isActive: boolean) {
    return this.prisma.coupon.update({ where: { id }, data: { isActive } });
  }
}
