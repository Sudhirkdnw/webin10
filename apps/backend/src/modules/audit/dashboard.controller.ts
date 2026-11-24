import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '@/common/prisma/prisma.service';
import { JwtPlatformGuard } from '@/common/guards/jwt-platform.guard';
import { PlatformRoleGuard } from '@/common/guards/platform-role.guard';
import { RequirePlatformRoles } from '@/common/decorators/require-roles.decorator';
import { PlatformRole } from '@webin10/shared-types';

@ApiTags('Super Admin Dashboard & Audits')
@ApiBearerAuth()
@UseGuards(JwtPlatformGuard, PlatformRoleGuard)
@Controller('super-admin')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('dashboard')
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
    PlatformRole.PLATFORM_OPERATIONS,
    PlatformRole.PLATFORM_SUPPORT,
    PlatformRole.PLATFORM_FINANCE,
    PlatformRole.PLATFORM_ANALYST,
  )
  @ApiOperation({ summary: 'High-level dashboard overview metrics and system health' })
  async getDashboardMetrics() {
    const [
      totalTenants,
      activeTenants,
      suspendedTenants,
      totalCategories,
      totalPlans,
      recentTenants,
      recentAuditLogs,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      this.prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.businessCategory.count({ where: { isActive: true } }),
      this.prisma.subscriptionPlan.count({ where: { isActive: true } }),
      this.prisma.tenant.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { name: true } },
          _count: { select: { branches: true, members: true } },
        },
      }),
      this.prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { name: true, email: true } },
        },
      }),
    ]);

    return {
      metrics: {
        totalTenants,
        activeTenants,
        suspendedTenants,
        totalCategories,
        totalPlans,
        systemStatus: 'OPERATIONAL',
      },
      recentTenants,
      recentAuditLogs,
    };
  }

  @Get('audit-logs')
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Paginated platform-wide immutable audit trail' })
  async getAuditLogs(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const page = Number(pageStr) || 1;
    const limit = Number(limitStr) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { name: true, email: true, role: true } },
          tenant: { select: { name: true, slug: true } },
        },
      }),
      this.prisma.auditLog.count(),
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
}
