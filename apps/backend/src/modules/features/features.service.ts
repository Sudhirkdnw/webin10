import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateFeatureFlagDto } from './dto/create-feature.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature.dto';
import { TenantFeatureOverrideDto } from './dto/tenant-feature-override.dto';

@Injectable()
export class FeaturesService {
  private readonly logger = new Logger(FeaturesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listFeatures() {
    return this.prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
      include: {
        _count: { select: { overrides: true } },
      },
    });
  }

  async createFeature(dto: CreateFeatureFlagDto, adminId: string, ip?: string) {
    const existing = await this.prisma.featureFlag.findUnique({
      where: { key: dto.key.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException(`Feature flag with key '${dto.key}' already exists`);
    }

    const flag = await this.prisma.featureFlag.create({
      data: {
        key: dto.key.toLowerCase().trim(),
        name: dto.name,
        description: dto.description,
        isEnabled: dto.isEnabled ?? false,
      },
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'feature_flag.create',
      entity: 'feature_flags',
      entityId: flag.id,
      details: { key: flag.key, isEnabled: flag.isEnabled },
      ipAddress: ip,
    });

    return flag;
  }

  async updateFeature(id: string, dto: UpdateFeatureFlagDto, adminId: string, ip?: string) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { id } });
    if (!flag) {
      throw new NotFoundException(`Feature flag with ID '${id}' not found`);
    }

    const updated = await this.prisma.featureFlag.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        isEnabled: dto.isEnabled,
      },
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'feature_flag.update',
      entity: 'feature_flags',
      entityId: id,
      details: dto,
      ipAddress: ip,
    });

    return updated;
  }

  async setTenantOverride(dto: TenantFeatureOverrideDto, adminId: string, ip?: string) {
    const [tenant, flag] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: dto.tenantId } }),
      this.prisma.featureFlag.findUnique({ where: { id: dto.flagId } }),
    ]);

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${dto.tenantId}' not found`);
    }
    if (!flag) {
      throw new NotFoundException(`Feature flag with ID '${dto.flagId}' not found`);
    }

    const override = await this.prisma.tenantFeatureOverride.upsert({
      where: {
        tenantId_flagId: {
          tenantId: dto.tenantId,
          flagId: dto.flagId,
        },
      },
      update: {
        isEnabled: dto.isEnabled,
      },
      create: {
        tenantId: dto.tenantId,
        flagId: dto.flagId,
        isEnabled: dto.isEnabled,
      },
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      tenantId: dto.tenantId,
      action: 'feature_flag.tenant_override',
      entity: 'tenant_feature_overrides',
      entityId: override.id,
      details: { flagKey: flag.key, isEnabled: dto.isEnabled },
      ipAddress: ip,
    });

    return override;
  }

  /**
   * Resolves effective feature flags for a tenant (Platform default + Tenant override)
   */
  async resolveEffectiveFeatures(tenantId: string) {
    const [allFlags, overrides] = await Promise.all([
      this.prisma.featureFlag.findMany(),
      this.prisma.tenantFeatureOverride.findMany({
        where: { tenantId },
      }),
    ]);

    const overrideMap = new Map(overrides.map((o) => [o.flagId, o.isEnabled]));

    const effective = allFlags.map((flag) => {
      const isOverridden = overrideMap.has(flag.id);
      const effectiveValue = isOverridden ? overrideMap.get(flag.id)! : flag.isEnabled;

      return {
        key: flag.key,
        name: flag.name,
        isEnabled: effectiveValue,
        source: isOverridden ? 'TENANT_OVERRIDE' : 'PLATFORM_DEFAULT',
      };
    });

    return effective;
  }
}
