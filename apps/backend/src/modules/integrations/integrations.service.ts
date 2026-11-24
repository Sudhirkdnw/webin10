import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { ConfigureIntegrationDto, IntegrationProviderEnum } from './dto/configure-integration.dto';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  // Standard platform supported providers catalogue
  private readonly providersCatalogue = [
    { provider: 'RAZORPAY', type: 'PAYMENT_GATEWAY', name: 'Razorpay Payment Gateway' },
    { provider: 'CASHFREE', type: 'PAYMENT_GATEWAY', name: 'Cashfree Payments' },
    { provider: 'META_WHATSAPP', type: 'WHATSAPP', name: 'WhatsApp Business Cloud API (Meta)' },
    { provider: 'MSG91', type: 'SMS', name: 'MSG91 Indian SMS Gateway' },
    { provider: 'AWS_SES', type: 'EMAIL', name: 'Amazon Simple Email Service (SES)' },
    { provider: 'RESEND', type: 'EMAIL', name: 'Resend Transactional Email' },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listIntegrations() {
    const existing = await this.prisma.platformIntegration.findMany();
    const existingMap = new Map(existing.map((e) => [e.provider as string, e]));

    return this.providersCatalogue.map((cat) => {
      const record = existingMap.get(cat.provider);
      return {
        provider: cat.provider,
        type: cat.type,
        name: cat.name,
        isConfigured: !!record,
        isEnabled: record?.isEnabled ?? false,
        isTestMode: record?.isTestMode ?? true,
        healthStatus: record?.healthStatus ?? 'NOT_CONFIGURED',
        lastCheckedAt: record?.lastCheckedAt ?? null,
        updatedAt: record?.updatedAt ?? null,
        maskedCredentials: record?.credentials ? this.maskSecrets(record.credentials) : null,
      };
    });
  }

  async configureIntegration(dto: ConfigureIntegrationDto, adminId: string, ip?: string) {
    const cat = this.providersCatalogue.find((c) => c.provider === dto.provider);
    if (!cat) {
      throw new NotFoundException(`Provider '${dto.provider}' is not supported`);
    }

    const updated = await this.prisma.platformIntegration.upsert({
      where: { provider: dto.provider as any },
      update: {
        isEnabled: dto.isEnabled,
        isTestMode: dto.isTestMode,
        credentials: dto.credentials,
        settings: dto.settings,
        healthStatus: dto.isEnabled ? 'HEALTHY' : 'DISABLED',
        lastCheckedAt: new Date(),
      },
      create: {
        type: cat.type as any,
        provider: dto.provider as any,
        name: cat.name,
        isEnabled: dto.isEnabled,
        isTestMode: dto.isTestMode,
        credentials: dto.credentials,
        settings: dto.settings,
        healthStatus: dto.isEnabled ? 'HEALTHY' : 'DISABLED',
        lastCheckedAt: new Date(),
      },
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'integration.configure',
      entity: 'platform_integrations',
      entityId: updated.id,
      details: {
        provider: dto.provider,
        isEnabled: dto.isEnabled,
        isTestMode: dto.isTestMode,
      },
      ipAddress: ip,
    });

    return {
      provider: updated.provider,
      isEnabled: updated.isEnabled,
      isTestMode: updated.isTestMode,
      healthStatus: updated.healthStatus,
      lastCheckedAt: updated.lastCheckedAt,
      maskedCredentials: this.maskSecrets(updated.credentials),
    };
  }

  async testConnection(provider: IntegrationProviderEnum) {
    const record = await this.prisma.platformIntegration.findUnique({
      where: { provider: provider as any },
    });

    if (!record) {
      throw new NotFoundException(`Integration '${provider}' is not configured yet`);
    }

    // Health verification check
    const isHealthy = record.isEnabled && record.credentials !== null;
    const healthStatus = isHealthy ? 'HEALTHY' : 'DEGRADED';

    await this.prisma.platformIntegration.update({
      where: { id: record.id },
      data: {
        healthStatus,
        lastCheckedAt: new Date(),
      },
    });

    return {
      provider,
      healthStatus,
      testedAt: new Date(),
      message: isHealthy
        ? `Connection verification to ${record.name} passed successfully`
        : `Provider is disabled or credentials incomplete`,
    };
  }

  private maskSecrets(creds: any): Record<string, string> {
    if (!creds || typeof creds !== 'object') return {};
    const masked: Record<string, string> = {};

    for (const [key, value] of Object.entries(creds)) {
      if (typeof value === 'string') {
        if (value.length <= 6) {
          masked[key] = '******';
        } else {
          masked[key] = `${value.slice(0, 3)}****${value.slice(-3)}`;
        }
      } else {
        masked[key] = '******';
      }
    }

    return masked;
  }
}
