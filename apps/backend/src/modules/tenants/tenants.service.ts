import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { MailService } from '@/modules/mail/mail.service';
import { WhatsAppService } from '@/modules/whatsapp/whatsapp.service';
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
    private readonly mailService: MailService,
    private readonly whatsAppService: WhatsAppService,
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

    // 6. Generate 6-digit OTP verification code & portal link
    const verificationOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const portalUrl = process.env.BUSINESS_ADMIN_URL || 'https://app.sudhirkdnw.in';

    // 7. Dispatch Welcome & Verification Email
    if (dto.ownerEmail) {
      try {
        await this.mailService.sendMail({
          to: dto.ownerEmail,
          subject: `🎉 Welcome to Webin10 OS - Verify Your Business (${result.tenant.name})`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800;">Webin10 Business OS</h1>
                <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Unified Multi-Tenant Business Operating Platform</p>
              </div>

              <div style="background: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                <h2 style="font-size: 16px; color: #0f172a; margin-top: 0;">Welcome, ${dto.ownerName}! 👋</h2>
                <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                  Your business workspace <strong>"${result.tenant.name}"</strong> has been successfully registered on Webin10 OS.
                </p>

                <div style="margin: 20px 0; text-align: center; background: #ffffff; border: 2px dashed #6366f1; border-radius: 8px; padding: 16px;">
                  <span style="font-size: 12px; color: #64748b; display: block; margin-bottom: 4px; text-transform: uppercase; font-weight: 600;">Your Account Verification OTP</span>
                  <span style="font-size: 28px; font-weight: 800; color: #4338ca; letter-spacing: 4px;">${verificationOtp}</span>
                </div>

                <div style="font-size: 13px; color: #475569; line-height: 1.6;">
                  <p style="margin: 4px 0;"><strong>Workspace Slug:</strong> ${result.tenant.slug}</p>
                  <p style="margin: 4px 0;"><strong>Category:</strong> ${category.name}</p>
                  <p style="margin: 4px 0;"><strong>Login Email:</strong> ${dto.ownerEmail}</p>
                </div>
              </div>

              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${portalUrl}" style="background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
                  Login to Business Admin OS &rarr;
                </a>
              </div>

              <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">
                If you did not request this registration, please contact support.
              </p>
            </div>
          `,
        });
        this.logger.log(`Welcome & verification email sent to ${dto.ownerEmail}`);
      } catch (err: any) {
        this.logger.warn(`Could not dispatch welcome email to ${dto.ownerEmail}: ${err.message}`);
      }
    }

    // 8. Dispatch Welcome & Verification WhatsApp Message
    if (dto.ownerPhone) {
      try {
        await this.whatsAppService.sendTextMessage(
          dto.ownerPhone,
          `🎉 *Welcome to Webin10 OS, ${result.tenant.name}!*\n\n` +
          `Your business workspace has been successfully registered.\n\n` +
          `🔐 *Verification Code (OTP):* *${verificationOtp}*\n` +
          `👤 *Account Login:* ${dto.ownerEmail}\n` +
          `👉 *Access Your Business Portal:* ${portalUrl}\n\n` +
          `Welcome aboard! Reply to this message if you have any questions.`,
        );
        this.logger.log(`Welcome WhatsApp notification dispatched to ${dto.ownerPhone}`);
      } catch (err: any) {
        this.logger.warn(`Could not dispatch welcome WhatsApp to ${dto.ownerPhone}: ${err.message}`);
      }
    }

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

  async deleteTenant(id: string, adminId: string, ip?: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${id}' not found`);
    }

    const tenantName = tenant.name;
    const tenantSlug = tenant.slug;

    await this.prisma.$transaction(async (tx) => {
      // 1. Audit logs have an FK without cascade, so clear them first
      await tx.auditLog.deleteMany({
        where: { tenantId: id },
      });

      // 2. Delete tenant (all other relations cascade automatically)
      await tx.tenant.delete({
        where: { id },
      });
    });

    // 3. Log the deletion in auditService
    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'tenant.delete',
      entity: 'tenants',
      entityId: id,
      details: {
        deletedTenantName: tenantName,
        deletedSlug: tenantSlug,
        deletedAt: new Date().toISOString(),
      },
      ipAddress: ip,
    });

    return {
      id,
      name: tenantName,
      message: `Tenant '${tenantName}' has been permanently deleted.`,
    };
  }
}
