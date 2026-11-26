import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateCouponDto, ValidateCouponDto } from './dto/create-coupon.dto';

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private get model(): any {
    return (this.prisma as any).platformCoupon;
  }

  async listCoupons() {
    return this.model.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCouponMetrics() {
    const coupons = await this.model.findMany();
    let totalCoupons = coupons.length;
    let activeCoupons = 0;
    let totalRedemptions = 0;
    let estimatedDiscountDistributed = 0;

    for (const c of coupons) {
      if (c.isEnabled) activeCoupons++;
      totalRedemptions += c.usedCount || 0;
      // Rough estimation: usedCount * discountValue (or default base ₹500)
      const avgDisc = c.discountType === 'PERCENTAGE' ? (c.discountValue / 100) * 1999 : c.discountValue;
      estimatedDiscountDistributed += Math.round((c.usedCount || 0) * avgDisc);
    }

    return {
      totalCoupons,
      activeCoupons,
      totalRedemptions,
      estimatedDiscountDistributed,
    };
  }

  async getCouponById(id: string) {
    const coupon = await this.model.findUnique({
      where: { id },
    });
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID '${id}' not found`);
    }
    return coupon;
  }

  async createCoupon(dto: CreateCouponDto, adminId?: string, ip?: string) {
    const normalizedCode = dto.code.trim().toUpperCase();

    const existing = await this.model.findUnique({
      where: { code: normalizedCode },
    });
    if (existing) {
      throw new ConflictException(`Coupon code '${normalizedCode}' already exists`);
    }

    const created = await this.model.create({
      data: {
        code: normalizedCode,
        description: dto.description || '',
        discountType: dto.discountType || 'PERCENTAGE',
        discountValue: Number(dto.discountValue),
        maxDiscount: dto.maxDiscount ? Number(dto.maxDiscount) : null,
        minPurchase: dto.minPurchase ? Number(dto.minPurchase) : 0,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        usageLimit: dto.usageLimit ? Number(dto.usageLimit) : null,
        perTenantLimit: dto.perTenantLimit ? Number(dto.perTenantLimit) : 1,
        applicablePlans: dto.applicablePlans || null,
        isEnabled: dto.isEnabled ?? true,
      },
    });

    if (adminId) {
      await this.auditService.log({
        actorId: adminId,
        actorType: 'PLATFORM_ADMIN',
        action: 'COUPON_CREATED',
        entity: 'PlatformCoupon',
        entityId: created.id,
        ipAddress: ip,
        details: { code: normalizedCode, discountType: created.discountType, discountValue: created.discountValue },
      });
    }

    return created;
  }

  async updateCoupon(id: string, dto: Partial<CreateCouponDto>, adminId?: string, ip?: string) {
    await this.getCouponById(id);

    const updateData: any = {};
    if (dto.code) updateData.code = dto.code.trim().toUpperCase();
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.discountType) updateData.discountType = dto.discountType;
    if (dto.discountValue !== undefined) updateData.discountValue = Number(dto.discountValue);
    if (dto.maxDiscount !== undefined) updateData.maxDiscount = dto.maxDiscount ? Number(dto.maxDiscount) : null;
    if (dto.minPurchase !== undefined) updateData.minPurchase = Number(dto.minPurchase);
    if (dto.validFrom) updateData.validFrom = new Date(dto.validFrom);
    if (dto.validUntil !== undefined) updateData.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
    if (dto.usageLimit !== undefined) updateData.usageLimit = dto.usageLimit ? Number(dto.usageLimit) : null;
    if (dto.perTenantLimit !== undefined) updateData.perTenantLimit = Number(dto.perTenantLimit);
    if (dto.applicablePlans !== undefined) updateData.applicablePlans = dto.applicablePlans;
    if (dto.isEnabled !== undefined) updateData.isEnabled = dto.isEnabled;

    const updated = await this.model.update({
      where: { id },
      data: updateData,
    });

    if (adminId) {
      await this.auditService.log({
        actorId: adminId,
        actorType: 'PLATFORM_ADMIN',
        action: 'COUPON_UPDATED',
        entity: 'PlatformCoupon',
        entityId: updated.id,
        ipAddress: ip,
        details: updateData,
      });
    }

    return updated;
  }

  async toggleCoupon(id: string, adminId?: string, ip?: string) {
    const existing = await this.getCouponById(id);
    const updated = await this.model.update({
      where: { id },
      data: { isEnabled: !existing.isEnabled },
    });

    if (adminId) {
      await this.auditService.log({
        actorId: adminId,
        actorType: 'PLATFORM_ADMIN',
        action: updated.isEnabled ? 'COUPON_ENABLED' : 'COUPON_DISABLED',
        entity: 'PlatformCoupon',
        entityId: updated.id,
        ipAddress: ip,
      });
    }

    return updated;
  }

  async deleteCoupon(id: string, adminId?: string, ip?: string) {
    const existing = await this.getCouponById(id);
    await this.model.delete({
      where: { id },
    });

    if (adminId) {
      await this.auditService.log({
        actorId: adminId,
        actorType: 'PLATFORM_ADMIN',
        action: 'COUPON_DELETED',
        entity: 'PlatformCoupon',
        entityId: id,
        ipAddress: ip,
        details: { code: existing.code },
      });
    }

    return { success: true, message: `Coupon '${existing.code}' removed successfully` };
  }

  /**
   * Public or Checkout coupon validation engine
   */
  async validateCoupon(dto: ValidateCouponDto) {
    const normalizedCode = dto.code ? dto.code.trim().toUpperCase() : '';
    if (!normalizedCode) {
      throw new BadRequestException('Coupon code is required');
    }

    const coupon = await this.model.findUnique({
      where: { code: normalizedCode },
    });

    if (!coupon) {
      throw new NotFoundException(`Invalid coupon code '${normalizedCode}'`);
    }

    if (!coupon.isEnabled) {
      throw new BadRequestException(`Coupon '${normalizedCode}' is currently inactive`);
    }

    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      throw new BadRequestException(`Coupon '${normalizedCode}' is not active yet`);
    }

    if (coupon.validUntil && now > coupon.validUntil) {
      throw new BadRequestException(`Coupon '${normalizedCode}' has expired`);
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException(`Coupon '${normalizedCode}' redemption limit has been reached`);
    }

    // Check plan compatibility if restricted
    if (dto.planSlug && Array.isArray(coupon.applicablePlans) && coupon.applicablePlans.length > 0) {
      const isApplicable = coupon.applicablePlans.some(
        (p: string) => p.toLowerCase() === dto.planSlug?.toLowerCase(),
      );
      if (!isApplicable) {
        throw new BadRequestException(`Coupon '${normalizedCode}' is not applicable to the '${dto.planSlug}' plan`);
      }
    }

    let basePrice = dto.planPrice !== undefined ? Number(dto.planPrice) : 0;
    if (!basePrice && dto.planSlug) {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { slug: dto.planSlug },
      });
      if (plan) {
        basePrice = plan.priceMonthly / 100;
      }
    }

    if (coupon.minPurchase && basePrice < coupon.minPurchase) {
      throw new BadRequestException(
        `Coupon requires a minimum purchase amount of ₹${coupon.minPurchase}`,
      );
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (basePrice * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    // Clamp discount
    discountAmount = Math.min(discountAmount, basePrice);
    const finalPrice = Math.max(0, basePrice - discountAmount);

    return {
      valid: true,
      isValid: true,
      couponId: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Number(discountAmount.toFixed(2)),
      originalPrice: basePrice,
      finalPrice: Number(finalPrice.toFixed(2)),
      savingsText: coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} FLAT OFF`,
    };
  }
}
