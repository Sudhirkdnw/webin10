import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateConfigurationDefinitionDto } from './dto/create-definition.dto';
import { SetConfigurationValueDto } from './dto/set-config-value.dto';
import { RollbackConfigurationDto } from './dto/rollback-config.dto';

@Injectable()
export class ConfigurationService {
  private readonly logger = new Logger(ConfigurationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listDefinitions() {
    return this.prisma.configurationDefinition.findMany({
      orderBy: { key: 'asc' },
      include: {
        values: {
          where: { tenantId: null }, // Platform-level values
          select: { value: true, version: true, updatedAt: true },
        },
        _count: { select: { versions: true, values: true } },
      },
    });
  }

  async createDefinition(dto: CreateConfigurationDefinitionDto, adminId: string, ip?: string) {
    this.validateValueType(dto.defaultValue, dto.dataType);

    const existing = await this.prisma.configurationDefinition.findUnique({
      where: { key: dto.key.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException(`Configuration key '${dto.key}' already exists`);
    }

    const definition = await this.prisma.$transaction(async (tx) => {
      const def = await tx.configurationDefinition.create({
        data: {
          key: dto.key.toLowerCase().trim(),
          name: dto.name,
          dataType: dto.dataType,
          defaultValue: dto.defaultValue,
          isPublic: dto.isPublic ?? false,
          description: dto.description,
        },
      });

      // Set initial platform-level default value (Version 1)
      await tx.configurationValue.create({
        data: {
          definitionId: def.id,
          tenantId: null,
          value: dto.defaultValue,
          version: 1,
        },
      });

      // Record Version 1 in version history
      await tx.configurationVersion.create({
        data: {
          definitionId: def.id,
          tenantId: null,
          version: 1,
          value: dto.defaultValue,
          previousValue: null,
          reason: 'Initial definition default creation',
          changedById: adminId,
        },
      });

      return def;
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'config.create_definition',
      entity: 'configuration_definitions',
      entityId: definition.id,
      details: { key: definition.key, dataType: definition.dataType },
      ipAddress: ip,
    });

    return definition;
  }

  async setValue(key: string, dto: SetConfigurationValueDto, adminId: string, ip?: string) {
    const definition = await this.prisma.configurationDefinition.findUnique({
      where: { key: key.toLowerCase().trim() },
    });

    if (!definition) {
      throw new NotFoundException(`Configuration key '${key}' not found`);
    }

    this.validateValueType(dto.value, definition.dataType as any);

    const tenantId = dto.tenantId || null;

    const existingValue = await this.prisma.configurationValue.findFirst({
      where: { definitionId: definition.id, tenantId },
    });

    const previousValue = existingValue?.value ?? definition.defaultValue;
    const nextVersion = (existingValue?.version ?? 0) + 1;

    const result = await this.prisma.$transaction(async (tx) => {
      let val;
      if (existingValue) {
        val = await tx.configurationValue.update({
          where: { id: existingValue.id },
          data: {
            value: dto.value,
            version: nextVersion,
          },
        });
      } else {
        val = await tx.configurationValue.create({
          data: {
            definitionId: definition.id,
            tenantId,
            value: dto.value,
            version: nextVersion,
          },
        });
      }

      // Record Version in history
      await tx.configurationVersion.create({
        data: {
          definitionId: definition.id,
          tenantId,
          version: nextVersion,
          value: dto.value,
          previousValue,
          reason: dto.reason || 'Configuration value update',
          changedById: adminId,
        },
      });

      return val;
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      tenantId: tenantId ?? undefined,
      action: 'config.set_value',
      entity: 'configuration_values',
      entityId: result.id,
      details: {
        key: definition.key,
        newVersion: nextVersion,
        previousValue,
        newValue: dto.value,
        reason: dto.reason,
      },
      ipAddress: ip,
    });

    return result;
  }

  async getVersionHistory(key: string, tenantId?: string) {
    const definition = await this.prisma.configurationDefinition.findUnique({
      where: { key: key.toLowerCase().trim() },
    });

    if (!definition) {
      throw new NotFoundException(`Configuration key '${key}' not found`);
    }

    return this.prisma.configurationVersion.findMany({
      where: {
        definitionId: definition.id,
        tenantId: tenantId || null,
      },
      orderBy: { version: 'desc' },
    });
  }

  async rollback(key: string, dto: RollbackConfigurationDto, adminId: string, ip?: string) {
    const definition = await this.prisma.configurationDefinition.findUnique({
      where: { key: key.toLowerCase().trim() },
    });

    if (!definition) {
      throw new NotFoundException(`Configuration key '${key}' not found`);
    }

    const tenantId = dto.tenantId || null;

    // Find the target historical version
    const targetVersion = await this.prisma.configurationVersion.findFirst({
      where: {
        definitionId: definition.id,
        tenantId,
        version: dto.version,
      },
    });

    if (!targetVersion) {
      throw new NotFoundException(
        `Version ${dto.version} for key '${key}' not found in history`,
      );
    }

    // Set value to target version's value with rollback explanation
    return this.setValue(
      key,
      {
        value: targetVersion.value,
        tenantId: dto.tenantId,
        reason: `Rollback to version ${dto.version}: ${dto.reason || 'Restored previous stable configuration'}`,
      },
      adminId,
      ip,
    );
  }

  /**
   * Resolves authoritative configuration for a given tenant.
   * Priority: Tenant Specific Value -> Platform Default Value -> Definition Default Value
   */
  async resolveEffectiveConfig(tenantId?: string) {
    const definitions = await this.prisma.configurationDefinition.findMany({
      include: {
        values: true,
      },
    });

    const result: Record<string, any> = {};

    for (const def of definitions) {
      let resolvedValue = def.defaultValue;

      if (tenantId) {
        const tenantVal = def.values.find((v) => v.tenantId === tenantId);
        if (tenantVal) {
          resolvedValue = tenantVal.value;
        } else {
          const platformVal = def.values.find((v) => v.tenantId === null);
          if (platformVal) resolvedValue = platformVal.value;
        }
      } else {
        const platformVal = def.values.find((v) => v.tenantId === null);
        if (platformVal) resolvedValue = platformVal.value;
      }

      result[def.key] = this.castValue(resolvedValue, def.dataType as any);
    }

    return result;
  }

  private validateValueType(val: string, type: 'string' | 'number' | 'boolean' | 'json') {
    if (type === 'number') {
      if (isNaN(Number(val))) throw new BadRequestException(`Value '${val}' is not a valid number`);
    } else if (type === 'boolean') {
      if (val !== 'true' && val !== 'false') throw new BadRequestException(`Value '${val}' must be 'true' or 'false'`);
    } else if (type === 'json') {
      try {
        JSON.parse(val);
      } catch {
        throw new BadRequestException(`Value is not valid JSON string`);
      }
    }
  }

  private castValue(val: string, type: 'string' | 'number' | 'boolean' | 'json') {
    if (type === 'number') return Number(val);
    if (type === 'boolean') return val === 'true';
    if (type === 'json') {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  }
}
