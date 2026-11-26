import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AssignCategoryModulesDto } from './dto/assign-modules.dto';
import { JwtPlatformGuard } from '@/common/guards/jwt-platform.guard';
import { PlatformRoleGuard } from '@/common/guards/platform-role.guard';
import { RequirePlatformRoles } from '@/common/decorators/require-roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PlatformRole, AuthenticatedUser } from '@webin10/shared-types';

@ApiTags('Super Admin Business Categories')
@ApiBearerAuth()
@UseGuards(JwtPlatformGuard, PlatformRoleGuard)
@Controller('super-admin/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
    PlatformRole.PLATFORM_SUPPORT,
    PlatformRole.PLATFORM_OPERATIONS,
  )
  @ApiOperation({ summary: 'List all business categories with linked default modules' })
  async list() {
    return this.categoriesService.listCategories();
  }

  @Get(':id')
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Get business category by ID' })
  async getById(@Param('id') id: string) {
    return this.categoriesService.getCategoryById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Create a new business category and assign initial modules' })
  async create(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.categoriesService.createCategory(dto, admin.id, ip);
  }

  @Patch(':id')
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Update business category metadata and status' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.categoriesService.updateCategory(id, dto, admin.id, ip);
  }

  @Put(':id/modules')
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Configure default modules assigned to this business vertical' })
  async assignModules(
    @Param('id') id: string,
    @Body() dto: AssignCategoryModulesDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.categoriesService.assignCategoryModules(id, dto, admin.id, ip);
  }

  @Get(':id/matrix')
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
    PlatformRole.PLATFORM_SUPPORT,
    PlatformRole.PLATFORM_OPERATIONS,
  )
  @ApiOperation({ summary: 'Get full 18-module availability, default, and mandatory matrix for vertical' })
  async getMatrix(@Param('id') id: string) {
    return this.categoriesService.getCategoryMatrix(id);
  }

  @Put(':id/matrix')
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Update module matrix (Available, Default ON, Mandatory) for category' })
  async updateMatrix(
    @Param('id') id: string,
    @Body()
    dto: {
      configs: Array<{
        moduleId?: string;
        moduleKey?: string;
        isAvailable: boolean;
        isDefault: boolean;
        isMandatory: boolean;
      }>;
    },
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.categoriesService.updateCategoryMatrix(id, dto.configs || [], admin.id, ip);
  }

  @Delete(':id')
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Delete a category if no businesses are associated with it' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.categoriesService.deleteCategory(id, admin.id, ip);
  }
}
