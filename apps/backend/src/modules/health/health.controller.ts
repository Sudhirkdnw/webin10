import { Controller, Get, Res, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { HealthService } from './health.service';
import { JwtPlatformGuard } from '@/common/guards/jwt-platform.guard';
import { PlatformRoleGuard } from '@/common/guards/platform-role.guard';
import { RequirePlatformRoles } from '@/common/decorators/require-roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PlatformRole, AuthenticatedUser } from '@webin10/shared-types';

@ApiTags('Platform Health & Telemetry')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check platform API and service health status (Public Ping)' })
  check() {
    return this.healthService.getBasicPing();
  }

  @Get('super-admin/system/telemetry')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
    PlatformRole.PLATFORM_OPERATIONS,
  )
  @ApiOperation({ summary: 'Live server hardware, database health, and queue telemetry' })
  async getTelemetry() {
    return this.healthService.getFullHealthDashboard();
  }

  @Get('super-admin/system/backup')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
  )
  @ApiOperation({ summary: '1-Click SQL Database Backup Generator and Stream' })
  async downloadBackup(
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const backup = await this.healthService.generateDatabaseBackup(admin.id, ip);

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${backup.filename}"`);
    return res.send(backup.sql);
  }
}
