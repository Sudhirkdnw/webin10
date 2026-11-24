import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

export interface CreateCampaignDto {
  name: string;
  templateCode: string;
  targetSegment: string; // ALL_ACTIVE, EXPIRED_MEMBERS, FEE_DUE, LEADS, ALL
  scheduledAt?: string;
  customMediaUrl?: string;
}

export interface ConnectAccountDto {
  mode: 'EMBEDDED_WABA' | 'SHARED_PLATFORM' | 'CUSTOM_TOKEN';
  phoneNumberId?: string;
  wabaId?: string;
  displayPhoneNumber?: string;
  accessToken?: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. Get or initialize Tenant's WhatsApp Account
   */
  async getAccount(tenantId: string) {
    let account = await this.prisma.whatsAppAccount.findUnique({
      where: { tenantId },
    });

    if (!account) {
      account = await this.prisma.whatsAppAccount.create({
        data: {
          tenantId,
          mode: 'SHARED_PLATFORM',
          status: 'CONNECTED',
          displayPhoneNumber: '+91 7070799200',
          qualityRating: 'GREEN',
          creditsBalance: 250.0,
        },
      });
    }

    return account;
  }

  /**
   * 2. Connect or update WhatsApp Account
   */
  async connectAccount(tenantId: string, dto: ConnectAccountDto) {
    const updated = await this.prisma.whatsAppAccount.upsert({
      where: { tenantId },
      update: {
        mode: dto.mode as any,
        status: 'CONNECTED',
        phoneNumberId: dto.phoneNumberId,
        wabaId: dto.wabaId,
        displayPhoneNumber: dto.displayPhoneNumber || '+91 7070799200',
        accessToken: dto.accessToken,
        updatedAt: new Date(),
      },
      create: {
        tenantId,
        mode: dto.mode as any,
        status: 'CONNECTED',
        phoneNumberId: dto.phoneNumberId,
        wabaId: dto.wabaId,
        displayPhoneNumber: dto.displayPhoneNumber || '+91 7070799200',
        accessToken: dto.accessToken,
        creditsBalance: 250.0,
      },
    });

    this.logger.log(`WhatsApp account updated for tenant ${tenantId}: mode=${dto.mode}`);
    return updated;
  }

  /**
   * 3. Disconnect WhatsApp Account
   */
  async disconnectAccount(tenantId: string) {
    return this.prisma.whatsAppAccount.update({
      where: { tenantId },
      data: {
        status: 'DISCONNECTED',
      },
    });
  }

  /**
   * 4. List WhatsApp Templates
   */
  async listTemplates(tenantId?: string) {
    return this.prisma.whatsAppTemplate.findMany({
      where: {
        OR: [
          { isSystemDefault: true },
          tenantId ? { tenantId } : {},
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 5. List Customers for Tenant (with filter & audience counts)
   */
  async listCustomers(tenantId: string, filter?: { status?: string; search?: string }) {
    const where: any = { tenantId };

    if (filter?.status && filter.status !== 'ALL') {
      where.status = filter.status;
    }

    if (filter?.search) {
      where.OR = [
        { firstName: { contains: filter.search, mode: 'insensitive' } },
        { lastName: { contains: filter.search, mode: 'insensitive' } },
        { phone: { contains: filter.search } },
      ];
    }

    const customers = await this.prisma.customer.findMany({
      where,
      orderBy: { joinedAt: 'desc' },
    });

    const activeCount = await this.prisma.customer.count({ where: { tenantId, status: 'ACTIVE' } });
    const expiredCount = await this.prisma.customer.count({ where: { tenantId, status: 'EXPIRED' } });
    const leadsCount = await this.prisma.customer.count({ where: { tenantId, status: 'LEAD' } });
    const feeDueCount = await this.prisma.customer.count({
      where: {
        tenantId,
        pendingAmount: { gt: 0 },
      },
    });

    return {
      customers,
      counts: {
        total: customers.length,
        active: activeCount,
        expired: expiredCount,
        leads: leadsCount,
        feeDue: feeDueCount,
      },
    };
  }

  /**
   * 6. Create Customer & trigger auto-welcome if configured
   */
  async createCustomer(tenantId: string, data: any) {
    const customer = await this.prisma.customer.create({
      data: {
        tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        status: data.status || 'ACTIVE',
        customerType: data.customerType || 'GENERAL',
        membershipPlan: data.membershipPlan,
        pendingAmount: data.pendingAmount ? Number(data.pendingAmount) : 0,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        notes: data.notes,
      },
    });

    // Check Automation Rule for MEMBER_WELCOME
    const welcomeRule = await this.prisma.whatsAppAutomationRule.findFirst({
      where: {
        tenantId,
        eventType: 'MEMBER_WELCOME',
      },
    });

    if (welcomeRule && welcomeRule.isEnabled) {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      const businessName = tenant?.name || 'Webin10 Partner';
      const appUrl = process.env.BUSINESS_ADMIN_URL || process.env.APP_URL || '';
      const memberPortalUrl = appUrl ? `${appUrl}/c/${customer.id}` : `/c/${customer.id}`;

      await this.sendDirectMessage({
        tenantId,
        customerId: customer.id,
        recipientPhone: customer.phone,
        recipientName: `${customer.firstName} ${customer.lastName || ''}`.trim(),
        templateCode: welcomeRule.templateCode,
        variables: [
          customer.firstName,
          businessName,
          customer.id.substring(0, 6).toUpperCase(),
          memberPortalUrl,
        ],
      });
    }

    return customer;
  }

  /**
   * 7. List Campaigns
   */
  async listCampaigns(tenantId: string) {
    return this.prisma.whatsAppCampaign.findMany({
      where: { tenantId },
      include: {
        template: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 8. Create and Dispatch / Schedule Bulk Campaign
   */
  async createCampaign(tenantId: string, dto: CreateCampaignDto) {
    const account = await this.getAccount(tenantId);
    if (!account.isEnabled || account.isBlocked) {
      throw new ForbiddenException(
        account.blockReason ||
          'WhatsApp service is currently disabled or restricted for your business by Super Admin. Please contact platform support.',
      );
    }
    if (Number(account.creditsBalance) <= 0) {
      throw new BadRequestException('Insufficient WhatsApp credits. Please contact Super Admin to recharge credits.');
    }

    const template = await this.prisma.whatsAppTemplate.findFirst({
      where: { code: dto.templateCode },
    });

    if (!template) {
      throw new NotFoundException(`Template '${dto.templateCode}' not found`);
    }

    // Determine target audience
    const customerWhere: any = { tenantId };
    if (dto.targetSegment === 'ALL_ACTIVE') {
      customerWhere.status = 'ACTIVE';
    } else if (dto.targetSegment === 'EXPIRED_MEMBERS') {
      customerWhere.status = 'EXPIRED';
    } else if (dto.targetSegment === 'FEE_DUE') {
      customerWhere.pendingAmount = { gt: 0 };
    } else if (dto.targetSegment === 'LEADS') {
      customerWhere.status = 'LEAD';
    }

    const recipients = await this.prisma.customer.findMany({
      where: customerWhere,
    });

    if (recipients.length === 0) {
      throw new BadRequestException(
        `No customers found in selected audience segment '${dto.targetSegment}'. Please add customers first.`,
      );
    }

    const campaign = await this.prisma.whatsAppCampaign.create({
      data: {
        tenantId,
        name: dto.name,
        templateId: template.id,
        targetSegment: dto.targetSegment,
        status: dto.scheduledAt ? 'SCHEDULED' : 'RUNNING',
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        totalCount: recipients.length,
      },
    });

    // If not scheduled for future, dispatch immediately
    if (!dto.scheduledAt) {
      this.dispatchCampaignAsync(campaign.id, tenantId, template, recipients);
    }

    return campaign;
  }

  /**
   * Internal async campaign batch dispatcher
   */
  private async dispatchCampaignAsync(
    campaignId: string,
    tenantId: string,
    template: any,
    recipients: any[],
  ) {
    this.logger.log(`Starting bulk dispatch for campaign ${campaignId} to ${recipients.length} recipients`);

    let sent = 0;
    let delivered = 0;
    let failed = 0;

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const businessName = tenant?.name || 'Webin10 Partner';

    for (const recipient of recipients) {
      try {
        const fullName = `${recipient.firstName} ${recipient.lastName || ''}`.trim();
        const content = template.bodyText
          .replace('{{1}}', recipient.firstName || 'Member')
          .replace('{{2}}', businessName)
          .replace('{{3}}', recipient.expiryDate ? new Date(recipient.expiryDate).toLocaleDateString() : 'Active')
          .replace('{{4}}', recipient.pendingAmount ? `₹${recipient.pendingAmount}` : 'None');

        await this.prisma.whatsAppMessageLog.create({
          data: {
            tenantId,
            campaignId,
            customerId: recipient.id,
            recipientPhone: recipient.phone,
            recipientName: fullName,
            direction: 'OUTBOUND',
            status: 'DELIVERED', // Simulated delivered status for immediate dispatch
            content,
            templateCode: template.code,
            metaMessageId: `wamid_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            sentAt: new Date(),
            deliveredAt: new Date(),
          },
        });

        sent++;
        delivered++;
      } catch (err: any) {
        failed++;
        this.logger.error(`Error sending message to ${recipient.phone}: ${err.message}`);
      }
    }

    // Deduct credits from account
    const cost = sent * 0.40; // ₹0.40 per marketing message
    await this.prisma.whatsAppAccount.update({
      where: { tenantId },
      data: {
        creditsBalance: { decrement: cost },
      },
    });

    await this.prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'COMPLETED',
        sentCount: sent,
        deliveredCount: delivered,
        readCount: Math.round(delivered * 0.8), // simulated 80% read rate
        failedCount: failed,
      },
    });

    this.logger.log(`Campaign ${campaignId} dispatch completed. Sent: ${sent}, Delivered: ${delivered}`);
  }

  /**
   * 9. Send Direct WhatsApp Message
   */
  async sendDirectMessage(params: {
    tenantId: string;
    recipientPhone: string;
    recipientName?: string;
    templateCode: string;
    variables?: string[];
    customerId?: string;
  }) {
    const account = await this.getAccount(params.tenantId);
    if (!account.isEnabled || account.isBlocked) {
      this.logger.warn(`Direct message skipped: WhatsApp is disabled/blocked for tenant ${params.tenantId}`);
      return null;
    }

    const template = await this.prisma.whatsAppTemplate.findFirst({
      where: { code: params.templateCode },
    });

    let content = template ? template.bodyText : 'Notification from Webin10';
    if (params.variables && template) {
      params.variables.forEach((v, idx) => {
        content = content.replace(new RegExp(`\\{\\{${idx + 1}\\}\\}`, 'g'), v);
      });
    }

    // Resolve Meta Cloud API credentials (from .env or database platform integration)
    const integration = await this.prisma.platformIntegration.findUnique({
      where: { provider: 'META_WHATSAPP' as any },
    });
    const creds = (integration?.credentials as any) || {};
    const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID || creds.phoneNumberId;
    const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN || creds.accessToken;

    let metaMessageId = `wamid_${Date.now()}`;
    let deliveryStatus = 'SENT';

    if (phoneNumberId && accessToken) {
      try {
        const cleanPhone = params.recipientPhone.replace(/[^0-9]/g, '');
        const metaRes = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: { preview_url: false, body: content },
          }),
        });
        const metaJson = await metaRes.json();
        if (metaJson.messages?.[0]?.id) {
          metaMessageId = metaJson.messages[0].id;
          deliveryStatus = 'DELIVERED';
          this.logger.log(`Meta WhatsApp dispatched: ${metaMessageId} to ${cleanPhone}`);
        } else {
          this.logger.warn(`Meta API response: ${JSON.stringify(metaJson)}`);
        }
      } catch (err: any) {
        this.logger.error(`Failed to dispatch Meta WhatsApp: ${err.message}`);
      }
    }

    const log = await this.prisma.whatsAppMessageLog.create({
      data: {
        tenantId: params.tenantId,
        customerId: params.customerId,
        recipientPhone: params.recipientPhone,
        recipientName: params.recipientName,
        direction: 'OUTBOUND',
        status: deliveryStatus as any,
        content,
        templateCode: params.templateCode,
        metaMessageId,
        sentAt: new Date(),
        deliveredAt: deliveryStatus === 'DELIVERED' ? new Date() : undefined,
      },
    });

    return log;
  }

  /**
   * 10. List Message Logs (Live Inbox & History)
   */
  async listLogs(tenantId: string, filter?: { direction?: string; limit?: number }) {
    const where: any = { tenantId };
    if (filter?.direction) {
      where.direction = filter.direction as any;
    }

    return this.prisma.whatsAppMessageLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filter?.limit || 100,
      include: {
        customer: true,
        campaign: true,
      },
    });
  }

  /**
   * 11. List & Update Automation Rules
   */
  async listAutomations(tenantId: string) {
    return this.prisma.whatsAppAutomationRule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateAutomation(tenantId: string, ruleId: string, data: { isEnabled?: boolean; triggerTiming?: number }) {
    return this.prisma.whatsAppAutomationRule.update({
      where: { id: ruleId },
      data,
    });
  }

  /**
   * Meta Webhook Verification
   */
  async verifyWebhookToken(mode: string, verifyToken: string): Promise<boolean> {
    if (mode !== 'subscribe') {
      return false;
    }

    const integration = await this.prisma.platformIntegration.findUnique({
      where: { provider: 'META_WHATSAPP' as any },
    });

    const creds = (integration?.credentials as any) || {};
    const configuredToken =
      process.env.META_WHATSAPP_VERIFY_TOKEN ||
      creds.webhookVerifyToken;

    if (!configuredToken) {
      this.logger.error('WhatsApp Webhook verification failed: META_WHATSAPP_VERIFY_TOKEN is not configured in .env or platform integration.');
      return false;
    }

    return verifyToken === configuredToken;
  }

  /**
   * Process incoming webhook events from Meta
   */
  async processIncomingEvent(payload: any): Promise<void> {
    try {
      if (payload.object === 'whatsapp_business_account') {
        const entries = payload.entry || [];
        for (const entry of entries) {
          const changes = entry.changes || [];
          for (const change of changes) {
            const value = change.value;
            if (value?.statuses) {
              for (const status of value.statuses) {
                this.logger.log(`Status update: ${status.id} -> ${status.status}`);
                // Update message log if found
                await this.prisma.whatsAppMessageLog.updateMany({
                  where: { metaMessageId: status.id },
                  data: {
                    status: (status.status.toUpperCase() as any) || 'DELIVERED',
                    deliveredAt: status.status === 'delivered' ? new Date() : undefined,
                    readAt: status.status === 'read' ? new Date() : undefined,
                  },
                });
              }
            }
            if (value?.messages) {
              for (const msg of value.messages) {
                this.logger.log(`Incoming WhatsApp from ${msg.from}: ${msg.text?.body}`);
                // Save inbound message
                const senderPhone = `+${msg.from}`;
                const customer = await this.prisma.customer.findFirst({
                  where: { phone: { contains: msg.from.slice(-10) } },
                });

                if (customer) {
                  await this.prisma.whatsAppMessageLog.create({
                    data: {
                      tenantId: customer.tenantId,
                      customerId: customer.id,
                      recipientPhone: senderPhone,
                      recipientName: `${customer.firstName} ${customer.lastName || ''}`.trim(),
                      direction: 'INBOUND',
                      status: 'DELIVERED',
                      content: msg.text?.body || '[Media]',
                      metaMessageId: msg.id,
                    },
                  });
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`Webhook processing error: ${err.message}`, err.stack);
    }
  }

  /**
   * Standalone test message via Meta WhatsApp Cloud API
   */
  async sendTextMessage(recipientPhone: string, text: string) {
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
    this.logger.log(`Sending WhatsApp text message to ${cleanPhone}: "${text}"`);

    const integration = await this.prisma.platformIntegration.findUnique({
      where: { provider: 'META_WHATSAPP' as any },
    });
    const creds = (integration?.credentials as any) || {};
    const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID || creds.phoneNumberId;
    const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN || creds.accessToken;

    let metaMessageId = `wamid_test_${Date.now()}`;
    let metaResponse: any = null;

    if (phoneNumberId && accessToken) {
      try {
        const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: { preview_url: false, body: text },
          }),
        });

        metaResponse = await res.json();
        if (!res.ok) {
          throw new BadRequestException(
            metaResponse.error?.message || 'Meta Cloud API call failed. Verify your access token and phone number ID.',
          );
        }
        metaMessageId = metaResponse.messages?.[0]?.id || metaMessageId;
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        throw new BadRequestException(`Meta network error: ${err.message}`);
      }
    } else {
      this.logger.warn('Meta WhatsApp credentials not found. Returning mock confirmation.');
    }

    return {
      success: true,
      messageId: metaMessageId,
      recipient: cleanPhone,
      mode: phoneNumberId && accessToken ? 'LIVE_META_API' : 'SIMULATION',
      metaResponse,
    };
  }

  // -------------------------------------------------------------------
  // SUPER ADMIN MANAGEMENT & PLATFORM AUTOMATIONS
  // -------------------------------------------------------------------

  /**
   * SUPER ADMIN: List all business tenants with WhatsApp configuration & usage
   */
  async listAdminTenants() {
    const tenants = await this.prisma.tenant.findMany({
      include: {
        profile: true,
        category: true,
        whatsAppAccount: true,
        _count: {
          select: {
            customers: true,
            whatsAppCampaigns: true,
            whatsAppLogs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tenants.map((t) => ({
      tenantId: t.id,
      name: t.name,
      slug: t.slug,
      category: t.category.name,
      phone: t.profile?.phone || 'N/A',
      email: t.profile?.email || 'N/A',
      status: t.status,
      whatsApp: {
        isConfigured: !!t.whatsAppAccount,
        isEnabled: t.whatsAppAccount?.isEnabled ?? true,
        isBlocked: t.whatsAppAccount?.isBlocked ?? false,
        blockReason: t.whatsAppAccount?.blockReason || null,
        mode: t.whatsAppAccount?.mode || 'SHARED_PLATFORM',
        creditsBalance: t.whatsAppAccount?.creditsBalance ? Number(t.whatsAppAccount.creditsBalance) : 250,
        totalCustomers: t._count.customers,
        totalCampaigns: t._count.whatsAppCampaigns,
        totalMessagesSent: t._count.whatsAppLogs,
      },
    }));
  }

  /**
   * SUPER ADMIN: Toggle WhatsApp access, block/unblock, or recharge credits for a business
   */
  async updateAdminTenantAccess(
    tenantId: string,
    data: {
      isEnabled?: boolean;
      isBlocked?: boolean;
      blockReason?: string;
      creditsAdjustment?: number;
    },
  ) {
    const account = await this.getAccount(tenantId);

    const updateData: any = {};
    if (typeof data.isEnabled === 'boolean') updateData.isEnabled = data.isEnabled;
    if (typeof data.isBlocked === 'boolean') updateData.isBlocked = data.isBlocked;
    if (data.blockReason !== undefined) updateData.blockReason = data.blockReason;
    if (data.creditsAdjustment) {
      updateData.creditsBalance = { increment: data.creditsAdjustment };
    }

    return this.prisma.whatsAppAccount.update({
      where: { id: account.id },
      data: updateData,
    });
  }

  /**
   * SUPER ADMIN: List Platform-wide Automations (Tenant onboarding, SaaS expiry, Invoices)
   */
  async listPlatformAutomations() {
    return this.prisma.whatsAppAutomationRule.findMany({
      where: { tenantId: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * SUPER ADMIN: Update Platform Automation rule toggle or timing
   */
  async updatePlatformAutomation(
    ruleId: string,
    data: { isEnabled?: boolean; triggerTiming?: number },
  ) {
    return this.prisma.whatsAppAutomationRule.update({
      where: { id: ruleId },
      data,
    });
  }

  /**
   * SUPER ADMIN: Broadcast WhatsApp message to ALL Registered Business Owners
   */
  async sendPlatformBroadcast(dto: {
    name: string;
    templateCode: string;
    messageText?: string;
    targetFilter?: string; // ALL, ACTIVE_TENANTS, TRIAL_TENANTS
  }) {
    const template = await this.prisma.whatsAppTemplate.findFirst({
      where: { code: dto.templateCode },
    });

    if (!template) {
      throw new NotFoundException(`Template '${dto.templateCode}' not found`);
    }

    const where: any = {};
    if (dto.targetFilter === 'ACTIVE_TENANTS') where.status = 'ACTIVE';

    const tenants = await this.prisma.tenant.findMany({
      where,
      include: { profile: true },
    });

    // Resolve Meta Cloud API credentials
    const integration = await this.prisma.platformIntegration.findUnique({
      where: { provider: 'META_WHATSAPP' as any },
    });
    const creds = (integration?.credentials as any) || {};
    const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID || creds.phoneNumberId;
    const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN || creds.accessToken;

    if (!phoneNumberId || !accessToken) {
      throw new BadRequestException(
        'Meta WhatsApp API credentials not configured! Please configure Phone Number ID and Access Token in Settings -> Integrations or .env',
      );
    }

    let sent = 0;
    for (const tenant of tenants) {
      const rawPhone = tenant.profile?.phone;
      if (rawPhone) {
        let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
          cleanPhone = cleanPhone.slice(1);
        }
        if (cleanPhone.length === 10) {
          cleanPhone = `91${cleanPhone}`;
        }

        const platformUrl = process.env.SUPER_ADMIN_URL || process.env.BUSINESS_ADMIN_URL || process.env.APP_URL || '';
        const content =
          dto.messageText ||
          template.bodyText
            .replace('{{1}}', tenant.name)
            .replace('{{2}}', 'Webin10 Platform')
            .replace('{{3}}', platformUrl);

        let metaMessageId = `wamid_platform_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        let deliveryStatus = 'SENT';

        try {
          const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: cleanPhone,
              type: 'text',
              text: { preview_url: false, body: content },
            }),
          });

          const metaJson = await res.json();
          if (res.ok && metaJson.messages?.[0]?.id) {
            metaMessageId = metaJson.messages[0].id;
            deliveryStatus = 'DELIVERED';
            sent++;
          } else {
            this.logger.error(`Meta broadcast failed for ${cleanPhone}: ${JSON.stringify(metaJson)}`);
            deliveryStatus = 'FAILED';
          }
        } catch (err: any) {
          this.logger.error(`Network error sending WhatsApp to ${cleanPhone}: ${err.message}`);
          deliveryStatus = 'FAILED';
        }

        await this.prisma.whatsAppMessageLog.create({
          data: {
            tenantId: tenant.id,
            recipientPhone: rawPhone,
            recipientName: tenant.name,
            direction: 'OUTBOUND',
            status: deliveryStatus as any,
            content,
            templateCode: template.code,
            metaMessageId,
            sentAt: new Date(),
            deliveredAt: deliveryStatus === 'DELIVERED' ? new Date() : undefined,
          },
        });
      }
    }

    return {
      success: true,
      broadcastName: dto.name,
      totalTenantsTargeted: tenants.length,
      sentCount: sent,
    };
  }

  /**
   * SUPER ADMIN: Platform-wide Stats
   */
  async getPlatformStats() {
    const totalTenants = await this.prisma.tenant.count();
    const enabledTenants = await this.prisma.whatsAppAccount.count({
      where: { isEnabled: true, isBlocked: false },
    });
    const totalLogs = await this.prisma.whatsAppMessageLog.count();
    const deliveredLogs = await this.prisma.whatsAppMessageLog.count({
      where: { status: 'DELIVERED' },
    });
    const totalCredits = await this.prisma.whatsAppAccount.aggregate({
      _sum: { creditsBalance: true },
    });

    return {
      totalTenants,
      enabledTenants,
      disabledTenants: totalTenants - enabledTenants,
      totalMessagesSent: totalLogs,
      deliverySuccessRate: totalLogs > 0 ? `${Math.round((deliveredLogs / totalLogs) * 100)}%` : '100%',
      totalCreditsInCirculation: totalCredits._sum.creditsBalance ? Number(totalCredits._sum.creditsBalance) : 0,
    };
  }
}
