import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
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
    const welcomeRule = await this.prisma.whatsAppAutomationRule.findUnique({
      where: {
        tenantId_eventType: {
          tenantId,
          eventType: 'MEMBER_WELCOME',
        },
      },
    });

    if (welcomeRule && welcomeRule.isEnabled) {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      const businessName = tenant?.name || 'Webin10 Partner';

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
          `https://webin10.com/c/${customer.id}`,
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
    const template = await this.prisma.whatsAppTemplate.findFirst({
      where: { code: params.templateCode },
    });

    let content = template ? template.bodyText : 'Notification from Webin10';
    if (params.variables && template) {
      params.variables.forEach((v, idx) => {
        content = content.replace(new RegExp(`\\{\\{${idx + 1}\\}\\}`, 'g'), v);
      });
    }

    const log = await this.prisma.whatsAppMessageLog.create({
      data: {
        tenantId: params.tenantId,
        customerId: params.customerId,
        recipientPhone: params.recipientPhone,
        recipientName: params.recipientName,
        direction: 'OUTBOUND',
        status: 'DELIVERED',
        content,
        templateCode: params.templateCode,
        metaMessageId: `wamid_${Date.now()}`,
        sentAt: new Date(),
        deliveredAt: new Date(),
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
      creds.webhookVerifyToken ||
      process.env.META_WHATSAPP_VERIFY_TOKEN ||
      'webin10_verify_secret';

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
   * Standalone test message
   */
  async sendTextMessage(recipientPhone: string, text: string) {
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
    this.logger.log(`Sending WhatsApp text message to ${cleanPhone}: "${text}"`);
    return {
      success: true,
      messageId: `wamid_test_${Date.now()}`,
      recipient: cleanPhone,
    };
  }
}
