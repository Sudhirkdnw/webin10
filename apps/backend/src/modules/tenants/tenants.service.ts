import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { ListTenantsDto } from './dto/list-tenants.dto';
import { SuspendTenantDto } from './dto/suspend-tenant.dto';
import { TenantStatus, TenantRole } from '@webin10/shared-types';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createTenant(dto: CreateTenantDto, adminId: string, ip?: string) {
    // 1. Verify category exists
    const category = await this.prisma.businessCategory.findUnique({
      where: { slug: dto.categorySlug },
    });

    if (!category) {
      throw new NotFoundException(`Business category '${dto.categorySlug}' not found`);
    }

    // 2. Generate slug and ensure uniqueness
    const baseSlug = dto.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    // 3. Optional initial subscription plan
    const plan = dto.planSlug
      ? await this.prisma.subscriptionPlan.findUnique({ where: { slug: dto.planSlug } })
      : await this.prisma.subscriptionPlan.findFirst({ where: { isActive: true } });

    // 4. Transactionally create Tenant, Profile, Owner User, Membership, Branch, and Subscriptions
    const result = await this.prisma.$transaction(async (tx) => {
      // Find or create Owner user
      let owner = await tx.user.findFirst({
        where: {
          OR: [{ email: dto.ownerEmail.toLowerCase() }, { phone: dto.ownerPhone }],
        },
      });

      if (!owner) {
        owner = await tx.user.create({
          data: {
            email: dto.ownerEmail.toLowerCase(),
            phone: dto.ownerPhone,
            name: dto.ownerName,
          },
        });
      }

      // Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug,
          status: TenantStatus.ACTIVE as any,
          categoryId: category.id,
        },
      });

      // Create Business Profile
      await tx.businessProfile.create({
        data: {
          tenantId: tenant.id,
          legalName: dto.name,
          phone: dto.ownerPhone,
          email: dto.ownerEmail.toLowerCase(),
        },
      });

      // Create Main Branch
      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: dto.branchName || 'Main Branch',
          phone: dto.ownerPhone,
          isMain: true,
        },
      });

      // Link Owner as Tenant Member
      await tx.tenantMember.create({
        data: {
          tenantId: tenant.id,
          userId: owner.id,
          role: TenantRole.BUSINESS_OWNER as any,
          isActive: true,
        },
      });

      // Assign initial subscription if plan available
      if (plan) {
        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() + 14); // 14-day trial default

        await tx.tenantSubscription.create({
          data: {
            tenantId: tenant.id,
            planId: plan.id,
            status: 'TRIAL',
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
          },
        });
      }

      return { tenant, branch, owner };
    });

    // 5. Audit Log
    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      tenantId: result.tenant.id,
      action: 'tenant.create',
      entity: 'tenants',
      entityId: result.tenant.id,
      details: { name: result.tenant.name, slug: result.tenant.slug, category: category.slug },
      ipAddress: ip,
    });

    return {
      id: result.tenant.id,
      name: result.tenant.name,
      slug: result.tenant.slug,
      status: result.tenant.status,
      category: category.name,
      mainBranchId: result.branch.id,
      owner: {
        id: result.owner.id,
        name: result.owner.name,
        email: result.owner.email,
        phone: result.owner.phone,
      },
    };
  }

  async listTenants(query: ListTenantsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.categorySlug) {
      where.category = { slug: query.categorySlug };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          profile: { select: { phone: true, email: true } },
          _count: {
            select: {
              branches: true,
              members: true,
            },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      items: tenants.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        status: t.status,
        category: t.category,
        contact: t.profile,
        branchesCount: t._count.branches,
        membersCount: t._count.members,
        createdAt: t.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTenantById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        category: true,
        profile: true,
        branches: true,
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        members: {
          include: { user: { select: { id: true, name: true, email: true, phone: true } } },
        },
        _count: {
          select: { branches: true, members: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${id}' not found`);
    }

    return tenant;
  }

  async suspendTenant(id: string, dto: SuspendTenantDto, adminId: string, ip?: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${id}' not found`);
    }

    if (tenant.status === TenantStatus.SUSPENDED) {
      throw new BadRequestException('Tenant is already suspended');
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status: TenantStatus.SUSPENDED as any },
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      tenantId: id,
      action: 'tenant.suspend',
      entity: 'tenants',
      entityId: id,
      details: { reason: dto.reason, previousStatus: tenant.status },
      ipAddress: ip,
    });

    return {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      message: 'Tenant suspended successfully',
    };
  }

  async activateTenant(id: string, adminId: string, ip?: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${id}' not found`);
    }

    if (tenant.status === TenantStatus.ACTIVE) {
      throw new BadRequestException('Tenant is already active');
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status: TenantStatus.ACTIVE as any },
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      tenantId: id,
      action: 'tenant.activate',
      entity: 'tenants',
      entityId: id,
      details: { previousStatus: tenant.status },
      ipAddress: ip,
    });

    return {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      message: 'Tenant activated successfully',
    };
  }
}
