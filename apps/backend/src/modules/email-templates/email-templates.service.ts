import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { CreateTemplateDto, PreviewTemplateDto, SendTestEmailDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class EmailTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
  ) {}

  async listTemplates() {
    return this.prisma.emailTemplate.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async getTemplateById(id: string) {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      throw new NotFoundException(`Email template with id '${id}' not found`);
    }
    return template;
  }

  async createTemplate(dto: CreateTemplateDto, adminId: string, ipAddress?: string) {
    const existing = await this.prisma.emailTemplate.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Email template with slug '${dto.slug}' already exists`);
    }

    const template = await this.prisma.emailTemplate.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        category: dto.category || 'SYSTEM',
        subject: dto.subject,
        bodyHtml: dto.bodyHtml,
        bodyText: dto.bodyText,
        variables: dto.variables || [],
        isActive: dto.isActive ?? true,
      },
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'CREATE_EMAIL_TEMPLATE',
      entity: 'EmailTemplate',
      entityId: template.id,
      details: { slug: template.slug, name: template.name },
      ipAddress,
    });

    return template;
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto, adminId: string, ipAddress?: string) {
    await this.getTemplateById(id);

    const updated = await this.prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.subject ? { subject: dto.subject } : {}),
        ...(dto.bodyHtml ? { bodyHtml: dto.bodyHtml } : {}),
        ...(dto.bodyText !== undefined ? { bodyText: dto.bodyText } : {}),
        ...(dto.variables ? { variables: dto.variables } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'UPDATE_EMAIL_TEMPLATE',
      entity: 'EmailTemplate',
      entityId: updated.id,
      details: { slug: updated.slug, name: updated.name },
      ipAddress,
    });

    return updated;
  }

  async deleteTemplate(id: string, adminId: string, ipAddress?: string) {
    const template = await this.getTemplateById(id);

    await this.prisma.emailTemplate.delete({
      where: { id },
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'DELETE_EMAIL_TEMPLATE',
      entity: 'EmailTemplate',
      entityId: id,
      details: { slug: template.slug, name: template.name },
      ipAddress,
    });

    return { success: true, message: `Email template '${template.name}' deleted` };
  }

  /**
   * Preview a template by substituting variables
   */
  async previewTemplate(id: string, dto: PreviewTemplateDto) {
    const template = await this.getTemplateById(id);
    const data = {
      app_name: 'Webin10',
      business_name: 'Apex Fitness & Gym',
      user_name: 'John Doe',
      login_url: 'https://app.webin10.com/login',
      plan_name: 'Growth Plan',
      expiry_date: '31 Dec 2026',
      days_remaining: '5',
      renew_url: 'https://app.webin10.com/billing/renew',
      invoice_number: 'INV-2026-0042',
      amount_paid: '₹999.00',
      payment_date: '24 Nov 2026',
      download_url: 'https://app.webin10.com/invoices/INV-2026-0042.pdf',
      reset_link: 'https://app.webin10.com/reset-password?token=sample_token_xyz',
      expiry_minutes: '30',
      support_email: 'support@webin10.com',
      ...(dto.sampleData || {}),
    };

    let renderedSubject = template.subject;
    let renderedHtml = template.bodyHtml;

    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      renderedSubject = renderedSubject.replace(regex, String(value));
      renderedHtml = renderedHtml.replace(regex, String(value));
    }

    return {
      templateId: template.id,
      name: template.name,
      slug: template.slug,
      subject: renderedSubject,
      html: renderedHtml,
      sampleDataUsed: data,
    };
  }

  /**
   * Send a test email using this template to a recipient email
   */
  async sendTestEmail(id: string, dto: SendTestEmailDto, adminId: string, ipAddress?: string) {
    const preview = await this.previewTemplate(id, { sampleData: dto.sampleData });

    const result = await this.mailService.sendMail({
      to: dto.recipientEmail,
      subject: `[TEST] ${preview.subject}`,
      html: preview.html,
      text: preview.subject,
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'SEND_TEST_EMAIL_TEMPLATE',
      entity: 'EmailTemplate',
      entityId: id,
      details: {
        recipientEmail: dto.recipientEmail,
        templateSlug: preview.slug,
        success: result.success,
      },
      ipAddress,
    });

    return result;
  }
}
