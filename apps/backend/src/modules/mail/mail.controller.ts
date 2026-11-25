import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { SendDirectEmailDto } from './dto/send-direct-email.dto';
import { CreateEmailCampaignDto } from './dto/create-email-campaign.dto';
import { ListEmailLogsDto } from './dto/list-email-logs.dto';

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
  // SUPER ADMIN SMTP CONTROLS
  // -------------------------------------------------------------

  @Post('super-admin/email/test-smtp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify and test SMTP credentials with a live test email' })
  async testSmtp(
    @Body() body: { config?: any; testRecipient?: string },
  ) {
    const config = body.config || (await this.mailService.getMailConfig());
    return this.mailService.verifyAndTestSmtp(config, body.testRecipient);
  }
}
