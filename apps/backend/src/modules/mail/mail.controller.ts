import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { SendDirectEmailDto } from './dto/send-direct-email.dto';
import { CreateEmailCampaignDto } from './dto/create-email-campaign.dto';
import { ListEmailLogsDto } from './dto/list-email-logs.dto';
import {
  SuperAdminBroadcastDto,
  SuperAdminSendDirectEmailDto,
  UpdateSmtpConfigDto,
} from './dto/super-admin-broadcast.dto';
import { JwtPlatformGuard } from '@/common/guards/jwt-platform.guard';
import { PlatformRoleGuard } from '@/common/guards/platform-role.guard';
import { RequirePlatformRoles } from '@/common/decorators/require-roles.decorator';
import { PlatformRole } from '@webin10/shared-types';

@ApiTags('Omni-Channel Email Communication & Campaigns')
@Controller()
export class MailController {
  constructor(private readonly mailService: MailService) {}

  // -------------------------------------------------------------
  // BUSINESS TENANT EMAIL HUB (GYM ADMIN WORKSPACE)
  // -------------------------------------------------------------

  @Get('tenants/:tenantId/email/stats')
  @ApiOperation({ summary: 'Get email delivery statistics for a business workspace' })
  async getStats(@Param('tenantId') tenantId: string) {
    return this.mailService.getTenantEmailStats(tenantId);
  }

  @Get('tenants/:tenantId/email/templates')
  @ApiOperation({ summary: 'Get available responsive email templates for marketing & notifications' })
  async getTemplates() {
    return this.mailService.getAvailableTemplates();
  }

  @Get('tenants/:tenantId/email/logs')
  @ApiOperation({ summary: 'List recent email delivery logs and recipient statuses' })
  async getLogs(
    @Param('tenantId') tenantId: string,
    @Query() query: ListEmailLogsDto,
  ) {
    return this.mailService.getTenantEmailLogs(tenantId, query);
  }

  @Post('tenants/:tenantId/email/send-single')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '1-Click send direct email to a single member or prospect' })
  async sendDirectEmail(
    @Param('tenantId') tenantId: string,
    @Body() dto: SendDirectEmailDto,
  ) {
    return this.mailService.sendDirectEmail(tenantId, dto);
  }

  @Post('tenants/:tenantId/email/campaigns')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create and launch a bulk email campaign blast to audience segments' })
  async launchCampaign(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateEmailCampaignDto,
  ) {
    return this.mailService.createAndLaunchCampaign(tenantId, dto);
  }

  // -------------------------------------------------------------
  // SUPER ADMIN PLATFORM EMAIL & BROADCAST HUB
  // -------------------------------------------------------------

  @Get('super-admin/email/stats')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
    PlatformRole.PLATFORM_OPERATIONS,
    PlatformRole.PLATFORM_SUPPORT,
  )
  @ApiOperation({ summary: 'Platform-wide email statistics, telemetry, and delivery rate' })
  async getSuperAdminStats() {
    return this.mailService.getSuperAdminEmailStats();
  }

  @Get('super-admin/email/gyms')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
    PlatformRole.PLATFORM_OPERATIONS,
  )
  @ApiOperation({ summary: 'List all gym tenants with owner emails for targeted broadcast' })
  async getGymsList() {
    return this.mailService.getSuperAdminGymsList();
  }

  @Post('super-admin/email/broadcast')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Broadcast email campaign blast to gym owners across India' })
  async broadcastToGyms(@Body() dto: SuperAdminBroadcastDto) {
    return this.mailService.launchSuperAdminBroadcast(dto);
  }

  @Post('super-admin/email/send-direct')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER, PlatformRole.PLATFORM_OPERATIONS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '1-Click send direct email from Super Admin to any recipient or gym' })
  async sendSuperAdminDirect(@Body() dto: SuperAdminSendDirectEmailDto) {
    return this.mailService.sendSuperAdminDirectEmail(dto);
  }

  @Get('super-admin/email/logs')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
    PlatformRole.PLATFORM_OPERATIONS,
    PlatformRole.PLATFORM_SUPPORT,
  )
  @ApiOperation({ summary: 'List platform-wide email delivery logs with status and error details' })
  async getSuperAdminLogs(
    @Query() query: ListEmailLogsDto & { tenantId?: string },
  ) {
    return this.mailService.getSuperAdminEmailLogs(query);
  }

  @Get('super-admin/email/smtp-config')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Get active SMTP configuration (credentials masked)' })
  async getSmtpConfig() {
    return this.mailService.getSuperAdminSmtpConfig();
  }

  @Put('super-admin/email/smtp-config')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Update global SMTP mail server configuration' })
  async updateSmtpConfig(@Body() dto: UpdateSmtpConfigDto) {
    return this.mailService.updateSuperAdminSmtpConfig(dto);
  }

  @Post('super-admin/email/test-smtp')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify and test SMTP credentials with a live test email' })
  async testSmtp(
    @Body() body: { config?: any; testRecipient?: string },
  ) {
    const config = body.config || (await this.mailService.getMailConfig());
    return this.mailService.verifyAndTestSmtp(config, body.testRecipient);
  }
}

