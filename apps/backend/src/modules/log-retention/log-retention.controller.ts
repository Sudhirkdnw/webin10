import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LogRetentionService } from './log-retention.service';
import { JwtPlatformGuard } from '@/common/guards/jwt-platform.guard';
import { PlatformRoleGuard } from '@/common/guards/platform-role.guard';
import { RequirePlatformRoles } from '@/common/decorators/require-roles.decorator';
import { PlatformRole } from '@webin10/shared-types';

@ApiTags('Super Admin Log Retention & Maintenance')
@ApiBearerAuth()
@UseGuards(JwtPlatformGuard, PlatformRoleGuard)
@Controller('super-admin/maintenance')
export class LogRetentionController {
  constructor(private readonly logRetentionService: LogRetentionService) {}

  @Post('prune-logs')
  @HttpCode(HttpStatus.OK)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Purge all platform logs (WhatsApp, Audit, Sessions) older than 5 days' })
  async pruneLogs(@Body() body?: { days?: number }) {
    const days = body?.days && body.days > 0 ? Number(body.days) : 5;
    return this.logRetentionService.purgeOldLogs(days);
  }
}
