import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import { SendDirectEmailDto } from './dto/send-direct-email.dto';
import { CreateEmailCampaignDto } from './dto/create-email-campaign.dto';
import { ListEmailLogsDto } from './dto/list-email-logs.dto';
import {
  SuperAdminBroadcastDto,
  SuperAdminBroadcastAudience,
  SuperAdminSendDirectEmailDto,
  UpdateSmtpConfigDto,
} from './dto/super-admin-broadcast.dto';
import { EmailMessageStatus, Prisma } from '@prisma/client';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  recipientName?: string;
}

export interface SmtpConfig {
  provider?: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password?: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}

export interface EmailLogMeta {
  tenantId?: string;
  customerId?: string;
  campaignId?: string;
  templateCode?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch current SMTP configuration from system settings.
   */
  async getMailConfig(): Promise<SmtpConfig> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'mail_settings' },
    });

    if (!setting || !setting.value) {
      return {
        provider: 'google',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        username: 'webin10.in@gmail.com',
        fromEmail: 'webin10.in@gmail.com',
        fromName: 'Webin10 Platform',
        replyTo: 'support@webin10.com',
      };
    }

    return setting.value as unknown as SmtpConfig;
  }

  /**
   * Create a nodemailer transporter using either provided config or saved config
   */
  createTransporter(config: SmtpConfig) {
    const isGoogle = config.provider === 'google' || config.host?.includes('gmail');

    if (isGoogle) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.username,
          pass: config.password, // 16-character Google App Password
        },
      });
    }

    return nodemailer.createTransport({
      host: config.host,
      port: Number(config.port) || 587,
      secure: Boolean(config.secure),
      auth: config.username && config.password ? {
        user: config.username,
        pass: config.password,
      } : undefined,
    });
  }

  /**
   * Verify SMTP connection and optionally send a test email
   */
  async verifyAndTestSmtp(config: SmtpConfig, testRecipient?: string) {
    try {
      const transporter = this.createTransporter(config);
      await transporter.verify();

      let testMailResult = null;
      if (testRecipient) {
        const fromHeader = config.fromName ? `"${config.fromName}" <${config.fromEmail}>` : config.fromEmail;
        testMailResult = await transporter.sendMail({
          from: fromHeader,
          to: testRecipient,
          replyTo: config.replyTo || config.fromEmail,
          subject: '✅ Webin10 SMTP Configuration Verified Successfully',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #10b981; border-radius: 8px;">
              <h2 style="color: #10b981; margin-top: 0;">SMTP Test Successful</h2>
              <p>Congratulations! Your email server connection on <strong>Webin10</strong> is working properly.</p>
              <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; font-size: 13px; font-family: monospace;">
                <strong>Host:</strong> ${config.host}<br/>
                <strong>Port:</strong> ${config.port}<br/>
                <strong>User:</strong> ${config.username}<br/>
                <strong>Provider:</strong> ${config.provider || 'Custom SMTP'}
              </div>
              <p style="font-size: 13px; color: #64748b; margin-top: 20px;">Sent via Webin10 Super Admin Mail Engine.</p>
            </div>
          `,
          text: `Webin10 SMTP Test Successful! Host: ${config.host}, Port: ${config.port}, User: ${config.username}`,
        });
      }

      return {
        success: true,
        message: 'SMTP credentials verified successfully' + (testRecipient ? ` and test email sent to ${testRecipient}` : ''),
        details: testMailResult ? { messageId: testMailResult.messageId } : null,
      };
    } catch (error: any) {
      this.logger.error(`SMTP Verification Failed: ${error.message}`);
      return {
        success: false,
        message: error.message || 'Failed to authenticate with SMTP server',
      };
    }
  }

  /**
   * Send an email and track it in EmailMessageLog
   */
  async sendMail(options: SendMailOptions, logMeta?: EmailLogMeta) {
    const config = await this.getMailConfig();

    let messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let status: EmailMessageStatus = EmailMessageStatus.SENT;
    let errorMessage: string | null = null;
    let isMock = false;

    if (!config.password) {
      // In development / local testing without SMTP password, gracefully simulate success
      this.logger.log(`[Dev Simulation] SMTP password not set. Simulating email dispatch to ${options.to}`);
      isMock = true;
    } else {
      try {
        const transporter = this.createTransporter(config);
        const fromHeader = options.from || (config.fromName ? `"${config.fromName}" <${config.fromEmail}>` : config.fromEmail);

        const info = await transporter.sendMail({
          from: fromHeader,
          to: options.to,
          replyTo: config.replyTo || config.fromEmail,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });

        messageId = info.messageId;
        this.logger.log(`Email dispatched to ${options.to}. MessageId: ${messageId}`);
      } catch (err: any) {
        this.logger.error(`Failed to send email to ${options.to}: ${err.message}`);
        status = EmailMessageStatus.FAILED;
        errorMessage = err.message;
      }
    }

    // Record in EmailMessageLog
    try {
      const log = await this.prisma.emailMessageLog.create({
        data: {
          tenantId: logMeta?.tenantId || null,
          campaignId: logMeta?.campaignId || null,
          customerId: logMeta?.customerId || null,
          recipientEmail: options.to,
          recipientName: options.recipientName || null,
          subject: options.subject,
          contentHtml: options.html,
          templateCode: logMeta?.templateCode || null,
          status,
          errorMessage,
          messageId,
          sentAt: new Date(),
        },
      });

      return {
        success: status === EmailMessageStatus.SENT,
        messageId,
        logId: log.id,
        isMock,
        message: status === EmailMessageStatus.SENT
          ? (isMock ? 'Email simulated successfully (Mock mode)' : 'Email dispatched successfully')
          : `Failed: ${errorMessage}`,
      };
    } catch (dbErr: any) {
      this.logger.warn(`Could not save EmailMessageLog: ${dbErr.message}`);
      return {
        success: status === EmailMessageStatus.SENT,
        messageId,
        isMock,
        message: 'Email processed',
      };
    }
  }

  /**
   * Send Templated Email with variable replacements
   */
  async sendTemplatedEmail(
    to: string,
    templateSlug: string,
    variables: Record<string, any> = {},
    logMeta?: EmailLogMeta,
    recipientName?: string,
  ) {
    const template = await this.prisma.emailTemplate.findFirst({
      where: {
        OR: [{ slug: templateSlug }, { name: { contains: templateSlug, mode: 'insensitive' } }],
      },
    });

    let subject = template?.subject || `Notification from Webin10`;
    let html = template?.bodyHtml || `<p>Hello {{customer_name}}, this is an update regarding your membership.</p>`;

    // Replace placeholders: {{key}}
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      subject = subject.replace(regex, String(value ?? ''));
      html = html.replace(regex, String(value ?? ''));
    }

    // Default fallbacks
    html = html.replace(/{{\s*customer_name\s*}}/g, recipientName || 'Valued Member');
    html = html.replace(/{{\s*user_name\s*}}/g, recipientName || 'Member');
    html = html.replace(/{{\s*app_name\s*}}/g, 'Webin10');

    return this.sendMail(
      {
        to,
        subject,
        html,
        recipientName,
      },
      {
        ...logMeta,
        templateCode: templateSlug,
      },
    );
  }

  /**
   * 1-Click Send Direct Email from Business Admin
   */
  async sendDirectEmail(tenantId: string, dto: SendDirectEmailDto) {
    let subject = dto.subject || 'Important Notification from your Gym';
    let html = dto.customHtml || '';

    // If templateSlug is provided, use template
    if (dto.templateSlug) {
      return this.sendTemplatedEmail(
        dto.recipientEmail,
        dto.templateSlug,
        dto.variables || {},
        {
          tenantId,
          customerId: dto.customerId,
          templateCode: dto.templateSlug,
        },
        dto.recipientName,
      );
    }

    // Otherwise send direct custom email
    return this.sendMail(
      {
        to: dto.recipientEmail,
        subject,
        html: html || `<p>Hello ${dto.recipientName || 'Member'},<br/>You have a new message from your gym.</p>`,
        recipientName: dto.recipientName,
      },
      {
        tenantId,
        customerId: dto.customerId,
      },
    );
  }

  /**
   * Launch Bulk Email Marketing Campaign
   */
  async createAndLaunchCampaign(tenantId: string, dto: CreateEmailCampaignDto) {
    // 1. Fetch matching audience
    const customerWhere: Prisma.CustomerWhereInput = { tenantId };

    if (dto.targetSegment === 'ACTIVE_MEMBERS') {
      customerWhere.status = 'ACTIVE';
    } else if (dto.targetSegment === 'EXPIRED_MEMBERS') {
      customerWhere.status = 'EXPIRED';
    } else if (dto.targetSegment === 'LEADS') {
      customerWhere.status = 'LEAD';
    }

    // Only customers who have an email address
    customerWhere.email = { not: null };

    const recipients = await this.prisma.customer.findMany({
      where: customerWhere,
      select: { id: true, firstName: true, lastName: true, email: true, membershipPlan: true },
    });

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });
    const businessName = tenant?.name || 'Your Gym';

    // 2. Create EmailCampaign record
    const campaign = await this.prisma.emailCampaign.create({
      data: {
        tenantId,
        name: dto.name,
        subject: dto.subject,
        templateId: dto.templateId || null,
        targetSegment: dto.targetSegment || 'ALL_CUSTOMERS',
        contentHtml: dto.contentHtml || null,
        status: 'RUNNING',
        totalCount: recipients.length,
      },
    });

    let sentCount = 0;
    let failedCount = 0;

    // 3. Dispatch to all recipients
    for (const recipient of recipients) {
      if (!recipient.email) continue;
      const fullName = `${recipient.firstName} ${recipient.lastName || ''}`.trim();

      const variables = {
        customer_name: fullName,
        member_name: fullName,
        business_name: businessName,
        gym_name: businessName,
        plan_name: recipient.membershipPlan || 'Annual Membership',
      };

      try {
        let emailHtml = dto.contentHtml;
        let emailSubject = dto.subject;

        if (dto.templateId) {
          const tpl = await this.prisma.emailTemplate.findUnique({ where: { id: dto.templateId } });
          if (tpl) {
            emailHtml = tpl.bodyHtml;
            emailSubject = tpl.subject;
          }
        }

        if (!emailHtml) {
          emailHtml = `<div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>${dto.subject}</h2>
            <p>Dear ${fullName},</p>
            <p>We are excited to share a special update from <strong>${businessName}</strong>!</p>
          </div>`;
        }

        // Variable substitution
        for (const [k, v] of Object.entries(variables)) {
          const re = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
          emailHtml = emailHtml.replace(re, String(v));
          emailSubject = emailSubject.replace(re, String(v));
        }

        const res = await this.sendMail(
          {
            to: recipient.email,
            subject: emailSubject,
            html: emailHtml,
            recipientName: fullName,
          },
          {
            tenantId,
            customerId: recipient.id,
            campaignId: campaign.id,
          },
        );

        if (res.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      } catch (e) {
        failedCount++;
      }
    }

    // 4. Update campaign status
    const updatedCampaign = await this.prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        status: 'COMPLETED',
        sentCount,
        failedCount,
        deliveredCount: sentCount,
      },
    });

    return {
      success: true,
      campaign: updatedCampaign,
      message: `Campaign "${dto.name}" dispatched to ${sentCount} recipients (${failedCount} failed).`,
    };
  }

  /**
   * Get Tenant Email Stats
   */
  async getTenantEmailStats(tenantId: string) {
    const [totalSent, totalFailed, totalCampaigns, totalRecipients] = await Promise.all([
      this.prisma.emailMessageLog.count({ where: { tenantId, status: 'SENT' } }),
      this.prisma.emailMessageLog.count({ where: { tenantId, status: 'FAILED' } }),
      this.prisma.emailCampaign.count({ where: { tenantId } }),
      this.prisma.customer.count({ where: { tenantId, email: { not: null } } }),
    ]);

    const total = totalSent + totalFailed;
    const deliveryRate = total > 0 ? Math.round((totalSent / total) * 100) : 100;

    return {
      totalSent,
      totalFailed,
      totalCampaigns,
      totalSubscribersWithEmail: totalRecipients,
      deliveryRate,
    };
  }

  /**
   * Get Tenant Email Logs (Paginated)
   */
  async getTenantEmailLogs(tenantId: string, query: ListEmailLogsDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.EmailMessageLogWhereInput = { tenantId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { recipientEmail: { contains: query.search, mode: 'insensitive' } },
        { recipientName: { contains: query.search, mode: 'insensitive' } },
        { subject: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.emailMessageLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.emailMessageLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get Available Email Templates
   */
  async getAvailableTemplates(category?: string) {
    const where: Prisma.EmailTemplateWhereInput = { isActive: true };
    if (category) where.category = category;

    return this.prisma.emailTemplate.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  // =============================================================
  // SUPER ADMIN EMAIL & BROADCAST HUB METHODS
  // =============================================================

  /**
   * SUPER ADMIN: Get platform-wide email statistics
   */
  async getSuperAdminEmailStats() {
    const [
      totalSent,
      totalFailed,
      totalCampaigns,
      totalGymTenants,
      smtpConfig,
    ] = await Promise.all([
      this.prisma.emailMessageLog.count({ where: { status: 'SENT' } }),
      this.prisma.emailMessageLog.count({ where: { status: 'FAILED' } }),
      this.prisma.emailCampaign.count(),
      this.prisma.tenant.count(),
      this.getMailConfig(),
    ]);

    // Count tenants reachable by email
    const tenantsWithProfile = await this.prisma.businessProfile.count({
      where: { email: { not: '' } },
    });

    const total = totalSent + totalFailed;
    const deliveryRate = total > 0 ? Math.round((totalSent / total) * 100) : 100;

    return {
      totalSent,
      totalFailed,
      totalCampaigns,
      totalGymTenants,
      totalAudienceReachable: tenantsWithProfile || totalGymTenants,
      deliveryRate,
      smtpConfigured: Boolean(smtpConfig.password && smtpConfig.username),
      smtpProvider: smtpConfig.provider || 'custom',
      fromEmail: smtpConfig.fromEmail,
    };
  }

  /**
   * SUPER ADMIN: Get list of Gyms with their contact emails and status
   */
  async getSuperAdminGymsList() {
    const tenants = await this.prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        profile: {
          select: { email: true, phone: true, legalName: true },
        },
        members: {
          where: { role: 'BUSINESS_OWNER', isActive: true },
          take: 1,
          select: {
            user: { select: { email: true, name: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = tenants.map((t) => {
      const ownerEmail = t.profile?.email || t.members[0]?.user?.email || null;
      const ownerName = t.members[0]?.user?.name || t.profile?.legalName || t.name;
      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        status: t.status,
        email: ownerEmail,
        ownerName,
        phone: t.profile?.phone || null,
      };
    });

    const activeCount = formatted.filter((t) => t.status === 'ACTIVE' && t.email).length;
    const totalWithEmail = formatted.filter((t) => Boolean(t.email)).length;

    return {
      gyms: formatted,
      counts: {
        all: totalWithEmail,
        active: activeCount,
        inactive: totalWithEmail - activeCount,
      },
    };
  }

  /**
   * SUPER ADMIN: Broadcast an Email Campaign to Gym Owners across India
   */
  async launchSuperAdminBroadcast(dto: SuperAdminBroadcastDto) {
    const gymsData = await this.getSuperAdminGymsList();
    let recipients = gymsData.gyms.filter((g) => Boolean(g.email));

    if (dto.targetAudience === SuperAdminBroadcastAudience.ACTIVE_GYMS) {
      recipients = recipients.filter((g) => g.status === 'ACTIVE');
    } else if (dto.targetAudience === SuperAdminBroadcastAudience.INACTIVE_GYMS) {
      recipients = recipients.filter((g) => g.status !== 'ACTIVE');
    } else if (dto.targetAudience === SuperAdminBroadcastAudience.SPECIFIC_GYM && dto.specificTenantId) {
      recipients = recipients.filter((g) => g.id === dto.specificTenantId);
    }

    if (recipients.length === 0) {
      throw new NotFoundException('No gym owners found matching the selected audience criteria');
    }

    const campaign = await this.prisma.emailCampaign.create({
      data: {
        tenantId: dto.specificTenantId || null,
        name: dto.name,
        subject: dto.subject,
        templateId: dto.templateId || null,
        targetSegment: dto.targetAudience,
        contentHtml: dto.contentHtml,
        status: 'RUNNING',
        totalCount: recipients.length,
      },
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const gym of recipients) {
      if (!gym.email) continue;

      let emailHtml = dto.contentHtml;
      let emailSubject = dto.subject;

      const variables: Record<string, string> = {
        gym_name: gym.name,
        business_name: gym.name,
        owner_name: gym.ownerName || 'Gym Partner',
        customer_name: gym.ownerName || 'Gym Partner',
        platform_name: 'Webin10 SaaS',
        support_email: 'support@webin10.com',
      };

      for (const [k, v] of Object.entries(variables)) {
        const re = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
        emailHtml = emailHtml.replace(re, v);
        emailSubject = emailSubject.replace(re, v);
      }

      const res = await this.sendMail(
        {
          to: gym.email,
          subject: emailSubject,
          html: emailHtml,
          recipientName: gym.ownerName,
        },
        {
          tenantId: gym.id,
          campaignId: campaign.id,
        },
      );

      if (res.success) {
        sentCount++;
      } else {
        failedCount++;
      }
    }

    await this.prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        status: 'COMPLETED',
        sentCount,
        failedCount,
        deliveredCount: sentCount,
      },
    });

    return {
      success: true,
      campaignId: campaign.id,
      sentCount,
      failedCount,
      totalCount: recipients.length,
      message: `Broadcast "${dto.name}" dispatched to ${sentCount} gym partners (${failedCount} failed).`,
    };
  }

  /**
   * SUPER ADMIN: Send a direct email to any recipient or gym
   */
  async sendSuperAdminDirectEmail(dto: SuperAdminSendDirectEmailDto) {
    if (dto.templateSlug) {
      return this.sendTemplatedEmail(
        dto.recipientEmail,
        dto.templateSlug,
        {
          customer_name: dto.recipientName || 'Partner',
          platform_name: 'Webin10 SaaS',
        },
        {
          tenantId: dto.tenantId,
        },
        dto.recipientName,
      );
    }

    return this.sendMail(
      {
        to: dto.recipientEmail,
        subject: dto.subject,
        html: dto.contentHtml,
        recipientName: dto.recipientName,
      },
      {
        tenantId: dto.tenantId,
      },
    );
  }

  /**
   * SUPER ADMIN: Get platform-wide email delivery logs (Paginated)
   */
  async getSuperAdminEmailLogs(query: ListEmailLogsDto & { tenantId?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.EmailMessageLogWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.tenantId) {
      where.tenantId = query.tenantId;
    }

    if (query.search) {
      where.OR = [
        { recipientEmail: { contains: query.search, mode: 'insensitive' } },
        { recipientName: { contains: query.search, mode: 'insensitive' } },
        { subject: { contains: query.search, mode: 'insensitive' } },
        { messageId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.emailMessageLog.findMany({
        where,
        include: {
          tenant: { select: { id: true, name: true, slug: true } },
          campaign: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.emailMessageLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * SUPER ADMIN: Get SMTP Configuration (password masked)
   */
  async getSuperAdminSmtpConfig() {
    const config = await this.getMailConfig();
    return {
      ...config,
      password: config.password ? '••••••••••••••••' : '',
      isConfigured: Boolean(config.password && config.username),
    };
  }

  /**
   * SUPER ADMIN: Save / Update SMTP Configuration
   */
  async updateSuperAdminSmtpConfig(dto: UpdateSmtpConfigDto) {
    const existing = await this.getMailConfig();
    const passwordToSave = dto.password && !dto.password.includes('•')
      ? dto.password
      : existing.password;

    const updatedConfig: SmtpConfig = {
      provider: dto.provider || existing.provider || 'google',
      host: dto.host,
      port: Number(dto.port) || 587,
      secure: Boolean(dto.secure),
      username: dto.username,
      password: passwordToSave,
      fromEmail: dto.fromEmail,
      fromName: dto.fromName,
      replyTo: dto.replyTo || dto.fromEmail,
    };

    await this.prisma.systemSetting.upsert({
      where: { key: 'mail_settings' },
      create: {
        key: 'mail_settings',
        group: 'mail',
        value: updatedConfig as any,
        isPublic: false,
      },
      update: {
        group: 'mail',
        value: updatedConfig as any,
        isPublic: false,
      },
    });

    return {
      success: true,
      message: 'SMTP settings saved successfully',
      config: {
        ...updatedConfig,
        password: updatedConfig.password ? '••••••••••••••••' : '',
        isConfigured: Boolean(updatedConfig.password && updatedConfig.username),
      },
    };
  }
}
