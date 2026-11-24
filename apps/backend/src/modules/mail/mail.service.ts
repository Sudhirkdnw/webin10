import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
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
   * Send an email using the saved platform SMTP config
   */
  async sendMail(options: SendMailOptions) {
    const config = await this.getMailConfig();

    if (!config.password) {
      this.logger.warn('SMTP password is not configured. Email will not be dispatched.');
      return { success: false, message: 'SMTP credentials not configured.' };
    }

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

      this.logger.log(`Email dispatched to ${options.to}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`);
      return { success: false, message: error.message };
    }
  }
}
