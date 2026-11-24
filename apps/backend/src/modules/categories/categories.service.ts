import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AssignCategoryModulesDto } from './dto/assign-modules.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listCategories() {
    return this.prisma.businessCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        categoryModules: {
          include: {
            module: { select: { id: true, key: true, name: true, description: true } },
          },
        },
        _count: {
          select: { tenants: true },
        },
      },
    });
  }

  async getCategoryById(id: string) {
    const category = await this.prisma.businessCategory.findUnique({
      where: { id },
      include: {
        categoryModules: {
          include: { module: true },
        },
        _count: { select: { tenants: true } },
      },
    });

    if (!category) {
      throw new NotFoundException(`Business category with ID '${id}' not found`);
    }

    return category;
  }

  async createCategory(dto: CreateCategoryDto, adminId: string, ip?: string) {
    const slug =
      dto.slug?.toLowerCase().trim() ||
      dto.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    const existing = await this.prisma.businessCategory.findFirst({
      where: { OR: [{ slug }, { name: dto.name }] },
    });

    if (existing) {
      throw new ConflictException(`Category with name '${dto.name}' or slug '${slug}' already exists`);
    }

    const category = await this.prisma.$transaction(async (tx) => {
      const cat = await tx.businessCategory.create({
        data: {
          name: dto.name,
          slug,
          description: dto.description,
        },
      });

      if (dto.defaultModuleKeys && dto.defaultModuleKeys.length > 0) {
        const modules = await tx.platformModule.findMany({
          where: { key: { in: dto.defaultModuleKeys } },
        });

        for (const mod of modules) {
          await tx.categoryModule.create({
            data: {
              categoryId: cat.id,
              moduleId: mod.id,
              isDefault: true,
            },
          });
        }
      }

      return cat;
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'category.create',
      entity: 'business_categories',
      entityId: category.id,
      details: { name: category.name, slug: category.slug },
      ipAddress: ip,
    });

    return this.getCategoryById(category.id);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, adminId: string, ip?: string) {
    const category = await this.prisma.businessCategory.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Business category with ID '${id}' not found`);
    }

    const updated = await this.prisma.businessCategory.update({
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
      action: 'category.update',
      entity: 'business_categories',
      entityId: id,
      details: dto,
      ipAddress: ip,
    });

    return updated;
  }

  async assignCategoryModules(id: string, dto: AssignCategoryModulesDto, adminId: string, ip?: string) {
    const category = await this.prisma.businessCategory.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Business category with ID '${id}' not found`);
    }

    const modules = await this.prisma.platformModule.findMany({
      where: { key: { in: dto.moduleKeys } },
    });

    await this.prisma.$transaction(async (tx) => {
      // Remove current mappings
      await tx.categoryModule.deleteMany({ where: { categoryId: id } });

      // Add new mappings
      for (const mod of modules) {
        await tx.categoryModule.create({
          data: {
            categoryId: id,
            moduleId: mod.id,
            isDefault: true,
          },
        });
      }
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'category.assign_modules',
      entity: 'business_categories',
      entityId: id,
      details: { moduleKeys: dto.moduleKeys },
      ipAddress: ip,
    });

    return this.getCategoryById(id);
  }

  async deleteCategory(id: string, adminId: string, ip?: string) {
    const category = await this.prisma.businessCategory.findUnique({
      where: { id },
      include: { _count: { select: { tenants: true } } },
    });

    if (!category) {
      throw new NotFoundException(`Business category with ID '${id}' not found`);
    }

    if (category._count.tenants > 0) {
      throw new BadRequestException(
        `Cannot delete category '${category.name}' because ${category._count.tenants} active tenant(s) are linked to it. Consider deactivating it instead.`,
      );
    }

    await this.prisma.businessCategory.delete({ where: { id } });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'category.delete',
      entity: 'business_categories',
      entityId: id,
      details: { name: category.name },
      ipAddress: ip,
    });

    return { message: `Category '${category.name}' deleted successfully` };
  }
}
