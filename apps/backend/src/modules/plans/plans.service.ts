import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateSubscriptionPlanDto } from './dto/create-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-plan.dto';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { ListSubscriptionsDto } from './dto/list-subscriptions.dto';

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listPlans(includeInactive = false) {
    return this.prisma.subscriptionPlan.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { priceMonthly: 'asc' },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });
  }

  async getPlanById(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID '${id}' not found`);
    }

    return plan;
  }

  async createPlan(dto: CreateSubscriptionPlanDto, adminId: string, ip?: string) {
    const slug =
      dto.slug?.toLowerCase().trim() ||
      dto.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(`Subscription plan with slug '${slug}' already exists`);
    }

    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        priceMonthly: dto.priceMonthly,
        maxCustomers: dto.maxCustomers,
        maxStaff: dto.maxStaff,
        maxBranches: dto.maxBranches,
        isActive: true,
      },
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'plan.create',
      entity: 'subscription_plans',
      entityId: plan.id,
      details: { name: plan.name, slug: plan.slug, priceMonthly: plan.priceMonthly },
      ipAddress: ip,
    });

    return plan;
  }

  async updatePlan(id: string, dto: UpdateSubscriptionPlanDto, adminId: string, ip?: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID '${id}' not found`);
    }

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        priceMonthly: dto.priceMonthly,
        maxCustomers: dto.maxCustomers,
        maxStaff: dto.maxStaff,
        maxBranches: dto.maxBranches,
        isActive: dto.isActive,
      },
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'plan.update',
      entity: 'subscription_plans',
      entityId: id,
      details: dto,
      ipAddress: ip,
    });

    return updated;
  }

  async listTenantSubscriptions(query: ListSubscriptionsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.planSlug) {
      where.plan = { slug: query.planSlug };
    }

    const [items, total] = await Promise.all([
      this.prisma.tenantSubscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: {
            select: { id: true, name: true, slug: true, status: true },
          },
          plan: {
            select: { id: true, name: true, slug: true, priceMonthly: true },
          },
        },
      }),
      this.prisma.tenantSubscription.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async assignTenantSubscription(dto: AssignSubscriptionDto, adminId: string, ip?: string) {
    const [tenant, plan] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: dto.tenantId } }),
      this.prisma.subscriptionPlan.findUnique({ where: { slug: dto.planSlug } }),
    ]);

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${dto.tenantId}' not found`);
    }
    if (!plan) {
      throw new NotFoundException(`Subscription plan with slug '${dto.planSlug}' not found`);
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (dto.durationDays || 30));

    // Create subscription record
    const subscription = await this.prisma.tenantSubscription.create({
      data: {
        tenantId: dto.tenantId,
        planId: plan.id,
        status: (dto.status || 'ACTIVE') as any,
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
      },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        plan: true,
      },
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      tenantId: dto.tenantId,
      action: 'subscription.assign',
      entity: 'tenant_subscriptions',
      entityId: subscription.id,
      details: {
        planSlug: plan.slug,
        status: dto.status,
        durationDays: dto.durationDays,
      },
      ipAddress: ip,
    });

    return subscription;
  }

  async checkTenantQuota(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          where: {
            status: { in: ['ACTIVE', 'TRIAL'] },
            currentPeriodEnd: { gte: new Date() },
          },
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            branches: true,
            members: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${tenantId}' not found`);
    }

    const activeSub = tenant.subscriptions[0];
    const plan = activeSub?.plan;

    const currentBranches = tenant._count.branches;
    const currentStaff = tenant._count.members;

    const maxBranches = plan?.maxBranches ?? 1;
    const maxStaff = plan?.maxStaff ?? 2;
    const maxCustomers = plan?.maxCustomers ?? 100;

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      subscription: activeSub
        ? {
            id: activeSub.id,
            status: activeSub.status,
            planName: plan?.name,
            currentPeriodEnd: activeSub.currentPeriodEnd,
          }
        : null,
      usage: {
        branches: {
          current: currentBranches,
          limit: maxBranches,
          isWithinLimit: currentBranches <= maxBranches,
        },
        staff: {
          current: currentStaff,
          limit: maxStaff,
          isWithinLimit: currentStaff <= maxStaff,
        },
        customers: {
          limit: maxCustomers,
        },
      },
    };
  }
}
