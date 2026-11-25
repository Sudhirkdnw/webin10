import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreatePlatformModuleDto } from './dto/create-module.dto';
import { UpdatePlatformModuleDto } from './dto/update-module.dto';

@Injectable()
export class PlatformModulesService {
  private readonly logger = new Logger(PlatformModulesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listModules() {
    return this.prisma.platformModule.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { categoryModules: true, tenantModules: true },
        },
      },
    });
  }

  async getModuleById(id: string) {
    const mod = await this.prisma.platformModule.findUnique({
      where: { id },
      include: {
        categoryModules: { include: { category: true } },
      },
    });

    if (!mod) {
      throw new NotFoundException(`Platform module with ID '${id}' not found`);
    }

    return mod;
  }

  async createModule(dto: CreatePlatformModuleDto, adminId: string, ip?: string) {
    const existing = await this.prisma.platformModule.findUnique({
      where: { key: dto.key.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException(`Platform module with key '${dto.key}' already exists`);
    }

    const mod = await this.prisma.platformModule.create({
      data: {
        key: dto.key.toLowerCase().trim(),
        name: dto.name,
        description: dto.description,
      },
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'platform_module.create',
      entity: 'platform_modules',
      entityId: mod.id,
      details: { key: mod.key, name: mod.name },
      ipAddress: ip,
    });

    return mod;
  }

  async updateModule(id: string, dto: UpdatePlatformModuleDto, adminId: string, ip?: string) {
    const mod = await this.prisma.platformModule.findUnique({ where: { id } });
    if (!mod) {
      throw new NotFoundException(`Platform module with ID '${id}' not found`);
    }

    const updated = await this.prisma.platformModule.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive,
      },
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'platform_module.update',
      entity: 'platform_modules',
      entityId: id,
      details: dto,
      ipAddress: ip,
    });

    return updated;
  }

  async toggleCategoryDefault(categoryId: string, moduleId: string, isDefault: boolean, adminId: string, ip?: string) {
    const existing = await this.prisma.categoryModule.findUnique({
      where: {
        categoryId_moduleId: { categoryId, moduleId },
      },
    });

    let record;
    if (existing) {
      record = await this.prisma.categoryModule.update({
        where: { id: existing.id },
        data: { isDefault },
      });
    } else {
      record = await this.prisma.categoryModule.create({
        data: { categoryId, moduleId, isDefault },
      });
    }

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'category_module.toggle_default',
      entity: 'category_modules',
      entityId: record.id,
      details: { categoryId, moduleId, isDefault },
      ipAddress: ip,
    });

    return {
      success: true,
      message: `Module default status updated for category.`,
      record,
    };
  }
}

