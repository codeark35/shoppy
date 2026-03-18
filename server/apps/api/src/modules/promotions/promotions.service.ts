import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@libs/prisma';
import { DiscountType, PromotionScope } from '@prisma/client';
import {
  CreateCouponDto,
  ValidateCouponDto,
  CreatePromotionDto,
  UpdatePromotionDto,
  PromotionListQueryDto,
} from './dto/promotions.dto';
import { Decimal } from '@prisma/client/runtime/library';

type PromotionCartItem = {
  variantId: string;
  price: number;
  quantity: number;
};

type AppliedPromotionItem = {
  variantId: string;
  promotionId: string;
  promotionName: string;
  discount: number;
  combinable: boolean;
};

export type PromotionApplyStrategy = 'AUTO_FIRST' | 'COUPON_FIRST' | 'BEST_PRICE';

export type AutomaticPromotionResult = {
  subtotalBefore: number;
  totalDiscount: number;
  subtotalAfter: number;
  hasNonCombinablePromotion: boolean;
  appliedItems: AppliedPromotionItem[];
};

export type PricingResult = {
  strategy: PromotionApplyStrategy;
  scenario: 'AUTO_ONLY' | 'COUPON_ONLY' | 'AUTO_THEN_COUPON';
  subtotalBefore: number;
  automaticDiscount: number;
  couponDiscount: number;
  totalDiscount: number;
  subtotalAfter: number;
  appliedCouponId?: string;
  appliedCouponCode?: string;
  hasNonCombinablePromotion: boolean;
  appliedItems: AppliedPromotionItem[];
};

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeMoney(value: number) {
    return Math.round(value * 100) / 100;
  }

  private validatePromotionTargets(
    scope: PromotionScope,
    productIds?: string[],
    categoryIds?: string[],
  ) {
    if (scope === PromotionScope.PRODUCT && (!productIds || productIds.length === 0)) {
      throw new BadRequestException('Para alcance PRODUCT debes enviar productIds');
    }

    if (scope === PromotionScope.CATEGORY && (!categoryIds || categoryIds.length === 0)) {
      throw new BadRequestException('Para alcance CATEGORY debes enviar categoryIds');
    }
  }

  private async assertTargetsExist(productIds?: string[], categoryIds?: string[]) {
    if (productIds?.length) {
      const count = await this.prisma.product.count({ where: { id: { in: productIds } } });
      if (count !== productIds.length) {
        throw new BadRequestException('Uno o mas productIds no existen');
      }
    }

    if (categoryIds?.length) {
      const count = await this.prisma.category.count({ where: { id: { in: categoryIds } } });
      if (count !== categoryIds.length) {
        throw new BadRequestException('Uno o mas categoryIds no existen');
      }
    }
  }

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

  async evaluateAutomaticPromotions(items: PromotionCartItem[]): Promise<AutomaticPromotionResult> {
    if (!items.length) {
      return {
        subtotalBefore: 0,
        totalDiscount: 0,
        subtotalAfter: 0,
        hasNonCombinablePromotion: false,
        appliedItems: [],
      };
    }

    const now = new Date();
    const subtotalBefore = Math.round(
      items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100,
    ) / 100;

    const variantIds = items.map((item) => item.variantId);

    const [variants, promotions] = await Promise.all([
      this.prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: {
          id: true,
          productId: true,
          product: { select: { categoryId: true } },
        },
      }),
      this.prisma.promotion.findMany({
        where: {
          isActive: true,
          validFrom: { lte: now },
          OR: [{ validUntil: null }, { validUntil: { gte: now } }],
        },
        include: {
          products: { select: { productId: true } },
          categories: { select: { categoryId: true } },
        },
      }),
    ]);

    const variantMap = new Map(
      variants.map((variant) => [
        variant.id,
        {
          productId: variant.productId,
          categoryId: variant.product.categoryId,
        },
      ]),
    );

    const appliedItems: AppliedPromotionItem[] = [];
    let totalDiscount = 0;

    for (const item of items) {
      const variantData = variantMap.get(item.variantId);
      if (!variantData) continue;

      const lineSubtotal = item.price * item.quantity;
      const candidates = promotions
        .filter((promotion) => {
          const minPurchase = promotion.minPurchaseAmount ? Number(promotion.minPurchaseAmount) : 0;
          if (subtotalBefore < minPurchase) return false;

          if (promotion.scope === PromotionScope.PRODUCT) {
            return promotion.products.some((p) => p.productId === variantData.productId);
          }

          if (promotion.scope === PromotionScope.CATEGORY) {
            return promotion.categories.some((c) => c.categoryId === variantData.categoryId);
          }

          return false;
        })
        .map((promotion) => {
          const value = Number(promotion.discountValue);
          const discountRaw = promotion.discountType === DiscountType.PERCENTAGE
            ? (lineSubtotal * value) / 100
            : Math.min(value, lineSubtotal);

          const discount = Math.round(discountRaw * 100) / 100;
          return { promotion, discount };
        })
        .filter((entry) => entry.discount > 0)
        .sort((a, b) => {
          if (b.discount !== a.discount) return b.discount - a.discount;
          return b.promotion.priority - a.promotion.priority;
        });

      const best = candidates[0];
      if (!best) continue;

      totalDiscount += best.discount;
      appliedItems.push({
        variantId: item.variantId,
        promotionId: best.promotion.id,
        promotionName: best.promotion.name,
        discount: best.discount,
        combinable: best.promotion.combinable,
      });
    }

    totalDiscount = Math.round(totalDiscount * 100) / 100;
    const subtotalAfter = Math.max(0, Math.round((subtotalBefore - totalDiscount) * 100) / 100);

    return {
      subtotalBefore,
      totalDiscount,
      subtotalAfter,
      hasNonCombinablePromotion: appliedItems.some((item) => !item.combinable),
      appliedItems,
    };
  }

  async calculatePricing(
    items: PromotionCartItem[],
    options?: { couponCode?: string; strategy?: PromotionApplyStrategy },
  ): Promise<PricingResult> {
    const strategy: PromotionApplyStrategy = options?.strategy ?? 'AUTO_FIRST';
    const couponCode = options?.couponCode?.trim();

    const auto = await this.evaluateAutomaticPromotions(items);
    const subtotalBefore = auto.subtotalBefore;

    const autoOnly: PricingResult = {
      strategy,
      scenario: 'AUTO_ONLY',
      subtotalBefore,
      automaticDiscount: auto.totalDiscount,
      couponDiscount: 0,
      totalDiscount: auto.totalDiscount,
      subtotalAfter: auto.subtotalAfter,
      hasNonCombinablePromotion: auto.hasNonCombinablePromotion,
      appliedItems: auto.appliedItems,
    };

    if (!couponCode) {
      return autoOnly;
    }

    const couponOnBase = await this.validateCoupon({
      code: couponCode,
      subtotal: subtotalBefore,
    });

    const couponOnly: PricingResult = {
      strategy,
      scenario: 'COUPON_ONLY',
      subtotalBefore,
      automaticDiscount: 0,
      couponDiscount: this.normalizeMoney(couponOnBase.discount),
      totalDiscount: this.normalizeMoney(couponOnBase.discount),
      subtotalAfter: this.normalizeMoney(couponOnBase.finalTotal),
      appliedCouponId: couponOnBase.couponId,
      appliedCouponCode: couponOnBase.code,
      hasNonCombinablePromotion: false,
      appliedItems: [],
    };

    let autoThenCoupon: PricingResult | null = null;
    if (!auto.hasNonCombinablePromotion) {
      const couponOnAuto = await this.validateCoupon({
        code: couponCode,
        subtotal: auto.subtotalAfter,
      });

      const couponDiscount = this.normalizeMoney(couponOnAuto.discount);
      const totalDiscount = this.normalizeMoney(auto.totalDiscount + couponDiscount);

      autoThenCoupon = {
        strategy,
        scenario: 'AUTO_THEN_COUPON',
        subtotalBefore,
        automaticDiscount: auto.totalDiscount,
        couponDiscount,
        totalDiscount,
        subtotalAfter: this.normalizeMoney(couponOnAuto.finalTotal),
        appliedCouponId: couponOnAuto.couponId,
        appliedCouponCode: couponOnAuto.code,
        hasNonCombinablePromotion: false,
        appliedItems: auto.appliedItems,
      };
    }

    if (strategy === 'COUPON_FIRST') {
      return couponOnly;
    }

    if (strategy === 'BEST_PRICE') {
      const candidates = [autoOnly, couponOnly, ...(autoThenCoupon ? [autoThenCoupon] : [])];
      return candidates.sort((a, b) => b.totalDiscount - a.totalDiscount)[0];
    }

    // AUTO_FIRST
    if (autoThenCoupon) {
      return autoThenCoupon;
    }

    return autoOnly.totalDiscount > 0 ? autoOnly : couponOnly;
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

  async listCoupons(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total, activeCount, usesAgg] = await Promise.all([
      this.prisma.coupon.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.coupon.count(),
      this.prisma.coupon.count({ where: { isActive: true } }),
      this.prisma.coupon.aggregate({ _sum: { usedCount: true } }),
    ]);
    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      activeCount,
      totalUses: usesAgg._sum.usedCount ?? 0,
    };
  }

  async toggleCoupon(id: string, isActive: boolean) {
    return this.prisma.coupon.update({ where: { id }, data: { isActive } });
  }

  async createPromotion(dto: CreatePromotionDto) {
    this.validatePromotionTargets(dto.scope, dto.productIds, dto.categoryIds);
    await this.assertTargetsExist(dto.productIds, dto.categoryIds);

    const promotion = await this.prisma.$transaction(async (tx) => {
      const created = await tx.promotion.create({
        data: {
          name: dto.name,
          description: dto.description,
          scope: dto.scope,
          discountType: dto.discountType,
          discountValue: new Decimal(dto.discountValue),
          minPurchaseAmount: dto.minPurchaseAmount !== undefined
            ? new Decimal(dto.minPurchaseAmount)
            : undefined,
          priority: dto.priority ?? 0,
          combinable: dto.combinable ?? false,
          validFrom: new Date(dto.validFrom),
          validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
          isActive: dto.isActive ?? true,
        },
      });

      if (dto.productIds?.length) {
        await tx.promotionProduct.createMany({
          data: dto.productIds.map((productId) => ({
            promotionId: created.id,
            productId,
          })),
          skipDuplicates: true,
        });
      }

      if (dto.categoryIds?.length) {
        await tx.promotionCategory.createMany({
          data: dto.categoryIds.map((categoryId) => ({
            promotionId: created.id,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }

      return created;
    });

    return this.getPromotionById(promotion.id);
  }

  async listPromotions(query: PromotionListQueryDto) {
    const { page = 1, limit = 20, isActive, scope, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (typeof isActive === 'boolean') where.isActive = isActive;
    if (scope) where.scope = scope;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          products: { select: { productId: true } },
          categories: { select: { categoryId: true } },
        },
      }),
      this.prisma.promotion.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPromotionById(id: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        products: { include: { product: { select: { id: true, name: true, slug: true } } } },
        categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
      },
    });

    if (!promotion) {
      throw new NotFoundException('Promocion no encontrada');
    }

    return promotion;
  }

  async updatePromotion(id: string, dto: UpdatePromotionDto) {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Promocion no encontrada');

    const nextScope = dto.scope ?? existing.scope;
    const nextProductIds = dto.productIds;
    const nextCategoryIds = dto.categoryIds;

    if (nextProductIds !== undefined || nextCategoryIds !== undefined || dto.scope !== undefined) {
      this.validatePromotionTargets(nextScope, nextProductIds, nextCategoryIds);
      await this.assertTargetsExist(nextProductIds, nextCategoryIds);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.promotion.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          scope: dto.scope,
          discountType: dto.discountType,
          discountValue: dto.discountValue !== undefined ? new Decimal(dto.discountValue) : undefined,
          minPurchaseAmount: dto.minPurchaseAmount !== undefined
            ? new Decimal(dto.minPurchaseAmount)
            : undefined,
          priority: dto.priority,
          combinable: dto.combinable,
          validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
          isActive: dto.isActive,
        },
      });

      if (dto.productIds !== undefined) {
        await tx.promotionProduct.deleteMany({ where: { promotionId: id } });
        if (dto.productIds.length) {
          await tx.promotionProduct.createMany({
            data: dto.productIds.map((productId) => ({ promotionId: id, productId })),
            skipDuplicates: true,
          });
        }
      }

      if (dto.categoryIds !== undefined) {
        await tx.promotionCategory.deleteMany({ where: { promotionId: id } });
        if (dto.categoryIds.length) {
          await tx.promotionCategory.createMany({
            data: dto.categoryIds.map((categoryId) => ({ promotionId: id, categoryId })),
            skipDuplicates: true,
          });
        }
      }
    });

    return this.getPromotionById(id);
  }

  async togglePromotion(id: string, isActive: boolean) {
    await this.prisma.promotion.update({ where: { id }, data: { isActive } });
    return { message: 'Promocion actualizada' };
  }

  async deletePromotion(id: string) {
    await this.prisma.promotion.delete({ where: { id } });
    return { message: 'Promocion eliminada' };
  }
}
