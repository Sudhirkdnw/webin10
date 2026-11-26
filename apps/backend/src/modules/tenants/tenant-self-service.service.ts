import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { TenantRole, InvoiceStatus } from '@prisma/client';

@Injectable()
export class TenantSelfService {
  private readonly logger = new Logger(TenantSelfService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  /**
   * 1. Get Tenant Subscription Details + Available Plans for Upgrade
   */
  async getSubscriptionDetails(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            customers: true,
            members: true,
            branches: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant '${tenantId}' not found`);
    }

    const currentSub = tenant.subscriptions[0] || null;
    const plan = currentSub?.plan || null;

    // Available plans
    const allPlans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });

    // Days remaining calculation
    let daysRemaining = 0;
    if (currentSub?.currentPeriodEnd) {
      const now = new Date();
      const diffMs = currentSub.currentPeriodEnd.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
      },
      currentSubscription: currentSub
        ? {
            id: currentSub.id,
            planName: plan?.name || 'Standard Tier',
            planSlug: plan?.slug || 'starter',
            status: currentSub.status,
            currentPeriodStart: currentSub.currentPeriodStart,
            currentPeriodEnd: currentSub.currentPeriodEnd,
            daysRemaining,
            priceMonthly: plan ? plan.priceMonthly / 100 : 0,
            features: [
              `Up to ${plan?.maxCustomers?.toLocaleString() || 500} Active Customers`,
              `Up to ${plan?.maxStaff || 3} Team Members`,
              `Up to ${plan?.maxBranches || 1} Business Branch`,
              'Automated WhatsApp & Email Hub Access',
              'GST Invoices & Instant Receipts',
              'Enterprise SSL & Cloud Backup',
            ],
          }
        : null,
      usage: {
        customersCount: tenant._count.customers,
        maxCustomers: plan?.maxCustomers || 500,
        staffCount: tenant._count.members,
        maxStaff: plan?.maxStaff || 3,
        branchesCount: tenant._count.branches,
        maxBranches: plan?.maxBranches || 1,
      },
      availablePlans: allPlans.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        priceMonthly: p.priceMonthly / 100,
        priceAnnual: Math.round((p.priceMonthly / 100) * 10), // 2 months free annual discount
        maxCustomers: p.maxCustomers,
        maxStaff: p.maxStaff,
        maxBranches: p.maxBranches,
        isCurrent: plan?.slug === p.slug,
      })),
    };
  }

  /**
   * 2. Upgrade / Renew Plan with Optional Coupon Code
   */
  async upgradeSubscription(
    tenantId: string,
    dto: { planSlug: string; couponCode?: string; billingCycle?: 'MONTHLY' | 'ANNUAL' },
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        profile: true,
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant '${tenantId}' not found`);
    }

    const targetPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { slug: dto.planSlug },
    });

    if (!targetPlan) {
      throw new NotFoundException(`Plan with slug '${dto.planSlug}' not found`);
    }

    const cycle = dto.billingCycle || 'MONTHLY';
    let basePrice = targetPlan.priceMonthly / 100;
    let periodDays = 30;

    if (cycle === 'ANNUAL') {
      basePrice = Math.round(basePrice * 10); // 2 months free
      periodDays = 365;
    }

    // Optional Coupon Validation
    let discountAmount = 0;
    let couponApplied: any = null;

    if (dto.couponCode && dto.couponCode.trim()) {
      const normalizedCode = dto.couponCode.trim().toUpperCase();
      const couponModel = (this.prisma as any).platformCoupon;
      if (couponModel) {
        const coupon = await couponModel.findUnique({
          where: { code: normalizedCode },
        });

        if (coupon && coupon.isEnabled) {
          const now = new Date();
          const isValidTime = (!coupon.validFrom || now >= coupon.validFrom) && (!coupon.validUntil || now <= coupon.validUntil);
          const hasUsageLimit = coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;
          const meetsMinPurchase = !coupon.minPurchase || basePrice >= coupon.minPurchase;

          if (isValidTime && !hasUsageLimit && meetsMinPurchase) {
            if (coupon.discountType === 'PERCENTAGE') {
              discountAmount = (basePrice * coupon.discountValue) / 100;
              if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
              }
            } else {
              discountAmount = coupon.discountValue;
            }
            discountAmount = Math.min(discountAmount, basePrice);
            couponApplied = coupon;

            // Increment coupon usage
            await couponModel.update({
              where: { id: coupon.id },
              data: { usedCount: { increment: 1 } },
            });
          }
        }
      }
    }

    const priceAfterDiscount = Math.max(0, basePrice - discountAmount);
    // 18% GST (9% CGST + 9% SGST)
    const taxRate = 18.0;
    const taxAmount = Number(((priceAfterDiscount * taxRate) / 100).toFixed(2));
    const cgst = Number((taxAmount / 2).toFixed(2));
    const sgst = Number((taxAmount / 2).toFixed(2));
    const totalAmount = Number((priceAfterDiscount + taxAmount).toFixed(2));

    // Determine new subscription validity window
    const now = new Date();
    const currentSub = tenant.subscriptions[0];
    let startDate = now;
    if (currentSub?.currentPeriodEnd && currentSub.currentPeriodEnd > now) {
      // Extend existing period
      startDate = currentSub.currentPeriodEnd;
    }
    const endDate = new Date(startDate.getTime() + periodDays * 24 * 60 * 60 * 1000);

    // Create / Update Subscription & PlatformInvoice in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create new subscription record
      const newSub = await tx.tenantSubscription.create({
        data: {
          tenantId,
          planId: targetPlan.id,
          status: 'ACTIVE',
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
        },
      });

      // Invoice number generation: INV-YYYYMM-XXXX
      const datePrefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const invoiceNumber = `${datePrefix}-${randomSuffix}`;

      const invoice = await tx.platformInvoice.create({
        data: {
          invoiceNumber,
          tenantId,
          subscriptionId: newSub.id,
          planName: targetPlan.name,
          amountSubtotal: priceAfterDiscount,
          taxPercentage: taxRate,
          cgstAmount: cgst,
          sgstAmount: sgst,
          igstAmount: 0.0,
          taxAmount,
          amountTotal: totalAmount,
          status: InvoiceStatus.PAID,
          billingPeriodStart: startDate,
          billingPeriodEnd: endDate,
          paidAt: now,
          paymentMethod: 'ONLINE_INSTANT',
          paymentReference: `PAY-${Date.now().toString(36).toUpperCase()}`,
          customerName: tenant.profile?.legalName || tenant.name,
          customerEmail: tenant.profile?.email || 'billing@' + tenant.slug + '.in',
          customerPhone: tenant.profile?.phone || '9876543210',
          customerGstin: tenant.profile?.taxId || null,
          customerAddress: tenant.profile?.address || 'India',
          notes: couponApplied ? `Discount Coupon applied: ${couponApplied.code}` : undefined,
        },
      });

      return { newSub, invoice };
    });

    return {
      success: true,
      message: `Successfully upgraded to ${targetPlan.name}! Your workspace is active until ${endDate.toLocaleDateString()}.`,
      subscription: result.newSub,
      invoice: result.invoice,
      savings: discountAmount > 0 ? `₹${discountAmount.toFixed(2)}` : null,
    };
  }

  /**
   * 3. Get All GST Tax Invoices for Tenant
   */
  async getInvoices(tenantId: string) {
    const invoices = await this.prisma.platformInvoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      planName: inv.planName,
      amountSubtotal: Number(inv.amountSubtotal),
      taxAmount: Number(inv.taxAmount),
      amountTotal: Number(inv.amountTotal),
      cgstAmount: Number(inv.cgstAmount),
      sgstAmount: Number(inv.sgstAmount),
      status: inv.status,
      billingPeriodStart: inv.billingPeriodStart,
      billingPeriodEnd: inv.billingPeriodEnd,
      paidAt: inv.paidAt,
      paymentMethod: inv.paymentMethod,
      customerName: inv.customerName,
      customerGstin: inv.customerGstin,
      createdAt: inv.createdAt,
    }));
  }

  /**
   * 4. Get Business Profile & Dynamic Branding
   */
  async getProfile(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        profile: true,
        category: true,
        branches: { where: { isMain: true } },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant '${tenantId}' not found`);
    }

    const mainBranch = tenant.branches[0] || null;

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      categoryName: tenant.category?.name || 'General Business',
      categorySlug: tenant.category?.slug || 'general',
      legalName: tenant.profile?.legalName || tenant.name,
      taxId: tenant.profile?.taxId || '',
      phone: tenant.profile?.phone || mainBranch?.phone || '',
      email: tenant.profile?.email || '',
      address: tenant.profile?.address || mainBranch?.address || '',
      logoUrl: tenant.profile?.logoUrl || '',
      createdAt: tenant.createdAt,
    };
  }

  /**
   * 5. Update Business Profile & Branding
   */
  async updateProfile(
    tenantId: string,
    dto: {
      name?: string;
      legalName?: string;
      taxId?: string;
      phone?: string;
      email?: string;
      address?: string;
      logoUrl?: string;
    },
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant '${tenantId}' not found`);
    }

    // Update Tenant name if provided
    if (dto.name && dto.name.trim()) {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { name: dto.name.trim() },
      });
    }

    // Upsert BusinessProfile
    const profile = await this.prisma.businessProfile.upsert({
      where: { tenantId },
      create: {
        tenantId,
        legalName: dto.legalName || dto.name || tenant.name,
        taxId: dto.taxId || null,
        phone: dto.phone || '9876543210',
        email: dto.email || 'contact@' + tenant.slug + '.in',
        address: dto.address || '',
        logoUrl: dto.logoUrl || null,
      },
      update: {
        ...(dto.legalName !== undefined ? { legalName: dto.legalName } : {}),
        ...(dto.taxId !== undefined ? { taxId: dto.taxId } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
      },
    });

    return {
      success: true,
      message: 'Business profile and branding updated successfully!',
      profile,
    };
  }

  /**
   * 6. Get Staff & Team Members
   */
  async getMembers(tenantId: string) {
    const members = await this.prisma.tenantMember.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      phone: m.user.phone || 'N/A',
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      isActive: m.isActive,
      joinedAt: m.joinedAt,
      createdAt: m.joinedAt,
      user: {
        id: m.user.id,
        email: m.user.email,
        phone: m.user.phone,
        name: m.user.name,
        fullName: m.user.name,
        isActive: m.isActive,
      },
    }));
  }

  /**
   * 7. Invite / Add New Staff Member
   */
  async addMember(
    tenantId: string,
    dto: { name: string; email: string; phone?: string; role: TenantRole },
  ) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    // Check plan staff limits
    const currentMemberCount = await this.prisma.tenantMember.count({
      where: { tenantId },
    });

    const activeSub = await this.prisma.tenantSubscription.findFirst({
      where: { tenantId, status: 'ACTIVE' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    const maxStaffAllowed = activeSub?.plan?.maxStaff || 3;
    if (currentMemberCount >= maxStaffAllowed) {
      throw new BadRequestException(
        `Staff limit of ${maxStaffAllowed} members reached. Please upgrade your plan in Billing to add more team members.`,
      );
    }

    // Find or create User
    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          name: dto.name.trim(),
          phone: dto.phone ? dto.phone.trim() : null,
          passwordHash: '$2b$10$epRswT7vX.C.8M/cM4C26.1vTqmXGfZm4x7H4qL7DqV1y2c1t1t1m', // Default password placeholder
        },
      });
    }

    // Check if already a member of this tenant
    const existingMember = await this.prisma.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException(`User '${normalizedEmail}' is already a team member of this workspace.`);
    }

    const member = await this.prisma.tenantMember.create({
      data: {
        tenantId,
        userId: user.id,
        role: dto.role || TenantRole.BUSINESS_MANAGER,
        isActive: true,
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    return {
      success: true,
      message: `Staff member '${user.name}' added successfully!`,
      member,
    };
  }

  /**
   * 8. Update Member Role
   */
  async updateMemberRole(tenantId: string, memberId: string, role: TenantRole) {
    const member = await this.prisma.tenantMember.findFirst({
      where: { id: memberId, tenantId },
    });

    if (!member) {
      throw new NotFoundException(`Member '${memberId}' not found in this workspace`);
    }

    const updated = await this.prisma.tenantMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      success: true,
      message: `Role for '${updated.user.name}' updated to ${role}.`,
      member: updated,
    };
  }

  /**
   * 9. Remove Member from Workspace
   */
  async removeMember(tenantId: string, memberId: string) {
    const member = await this.prisma.tenantMember.findFirst({
      where: { id: memberId, tenantId },
    });

    if (!member) {
      throw new NotFoundException(`Member '${memberId}' not found in this workspace`);
    }

    if (member.role === TenantRole.BUSINESS_OWNER) {
      const ownerCount = await this.prisma.tenantMember.count({
        where: { tenantId, role: TenantRole.BUSINESS_OWNER },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the primary Business Owner from the workspace.');
      }
    }

    await this.prisma.tenantMember.delete({
      where: { id: memberId },
    });

    return {
      success: true,
      message: 'Staff member removed from workspace.',
    };
  }

  /**
   * 10. Get Tenant Modules & Available Catalog (Strict Matrix Compliance)
   */
  async getTenantModules(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        category: {
          include: {
            categoryModules: {
              include: { module: true },
            },
          },
        },
        modules: {
          include: { module: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant '${tenantId}' not found`);
    }

    const allPlatformModules = await this.prisma.platformModule.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // Category mapping lookup
    const catModuleMap = new Map(
      tenant.category?.categoryModules?.map((cm) => [cm.moduleId, cm]) || [],
    );

    // If tenant has no modules yet, auto-provision default & mandatory modules for their category
    if (tenant.modules.length === 0 && catModuleMap.size > 0) {
      const defaultToProvision = Array.from(catModuleMap.values())
        .filter((cm) => cm.isDefault || cm.isMandatory)
        .map((cm) => cm.moduleId);

      await this.prisma.tenantModule.createMany({
        data: defaultToProvision.map((modId) => ({
          tenantId,
          moduleId: modId,
          isEnabled: true,
          isLocked: catModuleMap.get(modId)?.isMandatory || false,
        })),
        skipDuplicates: true,
      });

      // Refetch tenant modules
      const updatedModules = await this.prisma.tenantModule.findMany({
        where: { tenantId },
        include: { module: true },
      });
      tenant.modules = updatedModules;
    }

    const tenantModuleMap = new Map(tenant.modules.map((tm) => [tm.moduleId, tm]));

    const catalog = allPlatformModules.map((m) => {
      const catConfig = catModuleMap.get(m.id);
      const isAvailable = catConfig ? catConfig.isAvailable : false;
      const isMandatory = catConfig ? catConfig.isMandatory : false;
      const isDefault = catConfig ? catConfig.isDefault : false;

      const tenantRecord = tenantModuleMap.get(m.id);
      const isEnabled = isMandatory || (tenantRecord ? tenantRecord.isEnabled : isDefault);

      return {
        id: m.id,
        key: m.key,
        name: m.name,
        description: m.description,
        dependencies: m.dependencies || [],
        isAvailable,
        isMandatory,
        isDefault,
        isEnabled,
        isLocked: isMandatory || (tenantRecord?.isLocked ?? false),
      };
    });

    // Active keys are enabled and available modules
    const activeKeys = catalog.filter((m) => m.isEnabled && m.isAvailable).map((m) => m.key);

    return {
      tenantId,
      categorySlug: tenant.category?.slug || 'gym',
      categoryName: tenant.category?.name || 'General Business',
      activeKeys,
      modules: catalog.filter((m) => m.isAvailable), // Only expose modules available for this vertical
    };
  }

  /**
   * 11. Toggle Tenant Module with Mandatory & Dependency Enforcement
   */
  async toggleTenantModule(tenantId: string, moduleKey: string, isEnabled: boolean) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        category: {
          include: {
            categoryModules: {
              include: { module: true },
            },
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant '${tenantId}' not found`);
    }

    const mod = await this.prisma.platformModule.findUnique({
      where: { key: moduleKey.trim() },
    });
    if (!mod) {
      throw new NotFoundException(`Module with key '${moduleKey}' not found`);
    }

    // Check category rule
    const catModule = tenant.category?.categoryModules?.find((cm) => cm.moduleId === mod.id);
    if (catModule && !catModule.isAvailable) {
      throw new BadRequestException(`Module '${mod.name}' is not available for ${tenant.category?.name} vertical.`);
    }

    // Enforce Mandatory Protection
    if (catModule?.isMandatory && !isEnabled) {
      throw new BadRequestException(`Module '${mod.name}' is a mandatory core module for ${tenant.category?.name} and cannot be disabled.`);
    }

    // Dependency Resolution when enabling
    if (isEnabled && mod.dependencies && mod.dependencies.length > 0) {
      for (const depKey of mod.dependencies) {
        const depMod = await this.prisma.platformModule.findUnique({ where: { key: depKey } });
        if (depMod) {
          // Auto-enable dependency
          await this.prisma.tenantModule.upsert({
            where: { tenantId_moduleId: { tenantId, moduleId: depMod.id } },
            update: { isEnabled: true },
            create: { tenantId, moduleId: depMod.id, isEnabled: true },
          });
        }
      }
    }

    const updated = await this.prisma.tenantModule.upsert({
      where: {
        tenantId_moduleId: {
          tenantId,
          moduleId: mod.id,
        },
      },
      update: { isEnabled },
      create: {
        tenantId,
        moduleId: mod.id,
        isEnabled,
        isLocked: catModule?.isMandatory || false,
      },
      include: { module: true },
    });

    return {
      success: true,
      message: `Module '${mod.name}' is now ${isEnabled ? 'enabled' : 'disabled'}.`,
      moduleKey: mod.key,
      isEnabled: updated.isEnabled,
    };
  }

  // ==========================================
  // MODULE PERSISTENCE: ATTENDANCE
  // ==========================================
  async getAttendance(tenantId: string, date?: string, status?: string, search?: string) {
    const today = date || new Date().toISOString().split('T')[0];
    const where: any = { tenantId, date: today };
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    const records = await this.prisma.attendanceLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, date: today, records };
  }

  async recordAttendance(tenantId: string, dto: {
    name: string;
    role?: string;
    phone?: string;
    checkInTime?: string;
    method?: string;
    status?: string;
    date?: string;
    whatsappSent?: boolean;
  }) {
    const today = dto.date || new Date().toISOString().split('T')[0];
    const time = dto.checkInTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const log = await this.prisma.attendanceLog.create({
      data: {
        tenantId,
        name: dto.name,
        role: dto.role || 'Member',
        phone: dto.phone,
        checkInTime: dto.status === 'ABSENT' ? '-' : time,
        date: today,
        method: dto.method || 'MANUAL',
        status: dto.status || 'PRESENT',
        whatsappSent: dto.whatsappSent ?? true,
      },
    });

    // Auto-trigger WhatsApp entry alert if enabled
    if ((dto.whatsappSent ?? true) && dto.phone && dto.status !== 'ABSENT') {
      try {
        await this.whatsAppService.triggerAttendanceAlert(tenantId, {
          name: dto.name,
          phone: dto.phone,
          checkInTime: time,
          date: today,
          status: dto.status || 'PRESENT',
        });
      } catch (err: any) {
        this.logger.warn(`WhatsApp attendance trigger failed: ${err.message}`);
      }
    }

    return { success: true, data: log };
  }

  async toggleAttendanceStatus(tenantId: string, logId: string) {
    const log = await this.prisma.attendanceLog.findFirst({
      where: { id: logId, tenantId },
    });
    if (!log) throw new NotFoundException('Attendance log not found');
    const newStatus = log.status === 'PRESENT' ? 'ABSENT' : 'PRESENT';
    const updated = await this.prisma.attendanceLog.update({
      where: { id: logId },
      data: { status: newStatus },
    });
    return { success: true, data: updated };
  }

  // ==========================================
  // MODULE PERSISTENCE: UDHAR KHATA
  // ==========================================
  async getKhata(tenantId: string, search?: string, status?: string) {
    const where: any = { tenantId };
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    const entries = await this.prisma.khataEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, entries };
  }

  async createKhataEntry(tenantId: string, dto: {
    customerName: string;
    phone: string;
    amount: number;
    type?: string;
    notes?: string;
  }) {
    const entry = await this.prisma.khataEntry.create({
      data: {
        tenantId,
        customerName: dto.customerName,
        phone: dto.phone,
        amount: dto.amount,
        balanceDue: dto.amount,
        type: dto.type || 'CREDIT',
        status: 'PENDING',
        notes: dto.notes,
      },
    });

    // Auto-trigger WhatsApp Khata Balance Alert with UPI Payment Link
    if (dto.phone) {
      try {
        await this.whatsAppService.triggerKhataAlert(tenantId, {
          customerName: dto.customerName,
          phone: dto.phone,
          amount: dto.amount,
          balanceDue: dto.amount,
          notes: dto.notes,
        });
      } catch (err: any) {
        this.logger.warn(`WhatsApp khata trigger failed: ${err.message}`);
      }
    }

    return { success: true, data: entry };
  }

  async sendKhataReminder(tenantId: string, entryId: string) {
    const entry = await this.prisma.khataEntry.findFirst({
      where: { id: entryId, tenantId },
    });
    if (!entry) throw new NotFoundException('Khata entry not found');

    const result = await this.whatsAppService.triggerKhataAlert(tenantId, {
      customerName: entry.customerName,
      phone: entry.phone,
      amount: entry.amount,
      balanceDue: entry.balanceDue,
    });

    return {
      success: true,
      message: `WhatsApp payment reminder sent to ${entry.customerName}!`,
      logId: result?.id,
    };
  }

  async settleKhataEntry(tenantId: string, entryId: string) {
    await this.prisma.khataEntry.updateMany({
      where: { id: entryId, tenantId },
      data: { balanceDue: 0, status: 'SETTLED' },
    });
    return { success: true, message: 'Khata entry settled successfully' };
  }

  // ==========================================
  // MODULE PERSISTENCE: APPOINTMENTS
  // ==========================================
  async getAppointments(tenantId: string, slotDate?: string, status?: string, search?: string) {
    const where: any = { tenantId };
    if (slotDate) where.slotDate = slotDate;
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { service: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    const appointments = await this.prisma.appointment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, appointments };
  }

  async createAppointment(tenantId: string, dto: {
    clientName: string;
    phone: string;
    service: string;
    stylist?: string;
    timeSlot: string;
    slotDate?: string;
    amount?: string;
    notes?: string;
  }) {
    const today = dto.slotDate || new Date().toISOString().split('T')[0];
    const appointment = await this.prisma.appointment.create({
      data: {
        tenantId,
        clientName: dto.clientName,
        phone: dto.phone,
        service: dto.service,
        stylist: dto.stylist,
        timeSlot: dto.timeSlot,
        slotDate: today,
        amount: dto.amount || '₹0',
        status: 'CONFIRMED',
        notes: dto.notes,
      },
    });

    // Auto-trigger WhatsApp Appointment Confirmation
    if (dto.phone) {
      try {
        await this.whatsAppService.triggerAppointmentAlert(tenantId, {
          clientName: dto.clientName,
          phone: dto.phone,
          service: dto.service,
          stylist: dto.stylist,
          timeSlot: dto.timeSlot,
          slotDate: today,
          amount: dto.amount,
        });
      } catch (err: any) {
        this.logger.warn(`WhatsApp appointment trigger failed: ${err.message}`);
      }
    }

    return { success: true, data: appointment };
  }

  async sendRefillReminder(tenantId: string, dto: {
    patientName: string;
    phone: string;
    medicines: string;
    dosageDays: string;
    nextDueDate: string;
    totalCost?: string;
  }) {
    const result = await this.whatsAppService.triggerRefillAlert(tenantId, dto);
    return {
      success: true,
      message: `WhatsApp medicine refill reminder sent to ${dto.patientName}!`,
      logId: result?.id,
    };
  }

  async updateAppointmentStatus(tenantId: string, appointmentId: string, status: string) {
    await this.prisma.appointment.updateMany({
      where: { id: appointmentId, tenantId },
      data: { status },
    });
    return { success: true, message: `Appointment status updated to ${status}` };
  }

  // ==========================================
  // MODULE PERSISTENCE: INVENTORY
  // ==========================================
  async getInventory(tenantId: string, search?: string) {
    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }
    const items = await this.prisma.inventoryItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, items };
  }

  async createInventoryItem(tenantId: string, dto: {
    name: string;
    category?: string;
    sku: string;
    stock: number;
    minStock?: number;
    unitPrice?: string;
  }) {
    const min = dto.minStock ?? 10;
    const status = dto.stock <= min ? 'LOW_STOCK' : 'IN_STOCK';
    const item = await this.prisma.inventoryItem.create({
      data: {
        tenantId,
        name: dto.name,
        category: dto.category || 'General',
        sku: dto.sku,
        stock: dto.stock,
        minStock: min,
        unitPrice: dto.unitPrice || '₹0',
        status,
      },
    });
    return { success: true, data: item };
  }
}


