import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Param,
  Body,
  Res,
  HttpStatus,
  Logger,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WhatsAppService, CreateCampaignDto, ConnectAccountDto } from './whatsapp.service';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(private readonly whatsAppService: WhatsAppService) {}

  /**
   * Meta Webhook Verification Endpoint (GET)
   */
  @Get('webhook')
  @ApiOperation({ summary: 'Meta WhatsApp Webhook Verification Challenge' })
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    this.logger.log(`Received Meta webhook verification request: mode=${mode}, token=${verifyToken}`);

    const isValid = await this.whatsAppService.verifyWebhookToken(mode, verifyToken);

    if (isValid && challenge) {
      this.logger.log(`Webhook verified successfully. Returning challenge.`);
      return res.status(HttpStatus.OK).send(challenge);
    }

    this.logger.warn(`Webhook verification failed. Token mismatch or invalid mode.`);
    return res.status(HttpStatus.FORBIDDEN).send('Verification failed');
  }

  /**
   * Meta Webhook Event Receiver (POST)
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Meta WhatsApp Inbound Event Receiver' })
  async handleWebhookPayload(@Body() payload: any) {
    this.logger.log(`Received Meta WhatsApp webhook payload`);
    await this.whatsAppService.processIncomingEvent(payload);
    return { status: 'EVENT_RECEIVED' };
  }

  /**
   * Send Test WhatsApp Message
   */
  @Post('test-send')
  @ApiOperation({ summary: 'Send test message using configured WhatsApp credentials' })
  async testSendMessage(@Body() body: { recipientPhone: string; messageText?: string }) {
    return this.whatsAppService.sendTextMessage(
      body.recipientPhone,
      body.messageText || 'Hello from Webin10! Your WhatsApp Cloud API is successfully connected.',
    );
  }

  // -------------------------------------------------------------------
  // BUSINESS ADMIN / TENANT WHATSAPP MARKETING & AUTOMATION ENDPOINTS
  // -------------------------------------------------------------------

  @Get('accounts/:tenantId')
  @ApiOperation({ summary: "Get Tenant's WhatsApp Account Connection Details" })
  async getTenantAccount(@Param('tenantId') tenantId: string) {
    return this.whatsAppService.getAccount(tenantId);
  }

  @Post('accounts/:tenantId/connect')
  @ApiOperation({ summary: "Connect Tenant's WhatsApp Account (Embedded or Shared)" })
  async connectTenantAccount(
    @Param('tenantId') tenantId: string,
    @Body() dto: ConnectAccountDto,
  ) {
    return this.whatsAppService.connectAccount(tenantId, dto);
  }

  @Post('accounts/:tenantId/disconnect')
  @ApiOperation({ summary: "Disconnect Tenant's WhatsApp Account" })
  async disconnectTenantAccount(@Param('tenantId') tenantId: string) {
    return this.whatsAppService.disconnectAccount(tenantId);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List approved WhatsApp templates (System & Custom)' })
  async listTemplates(@Query('tenantId') tenantId?: string) {
    return this.whatsAppService.listTemplates(tenantId);
  }

  @Get('customers/:tenantId')
  @ApiOperation({ summary: 'List Customers & Audience counts for Tenant' })
  async listCustomers(
    @Param('tenantId') tenantId: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.whatsAppService.listCustomers(tenantId, { status, search });
  }

  @Post('customers/:tenantId')
  @ApiOperation({ summary: 'Add a new Customer (triggers Welcome WhatsApp if active)' })
  async createCustomer(
    @Param('tenantId') tenantId: string,
    @Body() data: any,
  ) {
    return this.whatsAppService.createCustomer(tenantId, data);
  }

  @Get('campaigns/:tenantId')
  @ApiOperation({ summary: 'List Bulk Broadcast Campaigns' })
  async listCampaigns(@Param('tenantId') tenantId: string) {
    return this.whatsAppService.listCampaigns(tenantId);
  }

  @Post('campaigns/:tenantId')
  @ApiOperation({ summary: 'Create and Dispatch Bulk Campaign' })
  async createCampaign(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.whatsAppService.createCampaign(tenantId, dto);
  }

  @Get('logs/:tenantId')
  @ApiOperation({ summary: 'List WhatsApp Inbound/Outbound Message Logs' })
  async listLogs(
    @Param('tenantId') tenantId: string,
    @Query('direction') direction?: string,
    @Query('limit') limit?: number,
  ) {
    return this.whatsAppService.listLogs(tenantId, { direction, limit: limit ? Number(limit) : undefined });
  }

  @Get('automations/:tenantId')
  @ApiOperation({ summary: 'List Automation Rules for Tenant' })
  async listAutomations(@Param('tenantId') tenantId: string) {
    return this.whatsAppService.listAutomations(tenantId);
  }

  @Put('automations/:tenantId/:ruleId')
  @ApiOperation({ summary: 'Update an Automation Rule toggle or timing' })
  async updateAutomation(
    @Param('tenantId') tenantId: string,
    @Param('ruleId') ruleId: string,
    @Body() data: { isEnabled?: boolean; triggerTiming?: number },
  ) {
    return this.whatsAppService.updateAutomation(tenantId, ruleId, data);
  }

  // -------------------------------------------------------------------
  // SUPER ADMIN MANAGEMENT & PLATFORM AUTOMATIONS
  // -------------------------------------------------------------------

  @Get('admin/tenants')
  @ApiOperation({ summary: 'Super Admin: List all tenants and their WhatsApp access status' })
  async listAdminTenants() {
    return this.whatsAppService.listAdminTenants();
  }

  @Put('admin/tenants/:tenantId/access')
  @ApiOperation({ summary: 'Super Admin: Enable/Disable, block, or adjust WhatsApp credits for a tenant' })
  async updateAdminTenantAccess(
    @Param('tenantId') tenantId: string,
    @Body()
    body: {
      isEnabled?: boolean;
      isBlocked?: boolean;
      blockReason?: string;
      creditsAdjustment?: number;
    },
  ) {
    return this.whatsAppService.updateAdminTenantAccess(tenantId, body);
  }

  @Get('admin/automations')
  @ApiOperation({ summary: 'Super Admin: List Platform-wide WhatsApp automations (Onboarding, SaaS expiry, Invoices)' })
  async listPlatformAutomations() {
    return this.whatsAppService.listPlatformAutomations();
  }

  @Put('admin/automations/:ruleId')
  @ApiOperation({ summary: 'Super Admin: Toggle Platform-wide WhatsApp automation rule' })
  async updatePlatformAutomation(
    @Param('ruleId') ruleId: string,
    @Body() body: { isEnabled?: boolean; triggerTiming?: number },
  ) {
    return this.whatsAppService.updatePlatformAutomation(ruleId, body);
  }

  @Post('admin/broadcast')
  @ApiOperation({ summary: 'Super Admin: Send WhatsApp broadcast to all registered business owners' })
  async sendPlatformBroadcast(
    @Body()
    body: {
      name: string;
      templateCode: string;
      messageText?: string;
      targetFilter?: string;
    },
  ) {
    return this.whatsAppService.sendPlatformBroadcast(body);
  }

  @Get('admin/stats')
  @ApiOperation({ summary: 'Super Admin: Get Platform-wide WhatsApp statistics' })
  async getPlatformStats() {
    return this.whatsAppService.getPlatformStats();
  }
}
