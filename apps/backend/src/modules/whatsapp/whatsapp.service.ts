import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verify webhook token against database integration settings or fallback
   */
  async verifyWebhookToken(mode: string, verifyToken: string): Promise<boolean> {
    if (mode !== 'subscribe') {
      return false;
    }

    // Try finding configured verify token from platform_integrations
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
   * Process incoming webhook events from Meta (messages, read receipts, delivery updates)
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
                this.logger.log(
                  `WhatsApp message ID ${status.id} status update: ${status.status} for ${status.recipient_id}`,
                );
              }
            }
            if (value?.messages) {
              for (const msg of value.messages) {
                this.logger.log(
                  `Inbound WhatsApp message from ${msg.from} [${msg.type}]: ${
                    msg.text ? msg.text.body : '<media>'
                  }`,
                );
              }
            }
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`Error processing WhatsApp webhook event: ${err.message}`, err.stack);
    }
  }

  /**
   * Send a WhatsApp message via Meta Cloud API
   */
  async sendTextMessage(recipientPhone: string, text: string) {
    const integration = await this.prisma.platformIntegration.findUnique({
      where: { provider: 'META_WHATSAPP' as any },
    });

    if (!integration || !integration.isEnabled) {
      throw new BadRequestException('Meta WhatsApp integration is not enabled in System Settings');
    }

    const creds = (integration.credentials as any) || {};
    const phoneNumberId = creds.phoneNumberId || process.env.META_WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = creds.accessToken || process.env.META_WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      throw new BadRequestException('Meta WhatsApp Phone Number ID or Access Token is missing');
    }

    // Sanitize phone number (remove + or whitespace)
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');

    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: text,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        this.logger.error(`Meta Cloud API error: ${JSON.stringify(data)}`);
        throw new BadRequestException(data.error?.message || 'Meta Cloud API call failed');
      }

      this.logger.log(`WhatsApp message sent successfully to ${cleanPhone}: ${JSON.stringify(data)}`);
      return {
        success: true,
        messageId: data.messages?.[0]?.id,
        recipient: cleanPhone,
      };
    } catch (err: any) {
      this.logger.error(`Failed to send WhatsApp message: ${err.message}`);
      throw new BadRequestException(err.message || 'WhatsApp sending failed');
    }
  }
}
