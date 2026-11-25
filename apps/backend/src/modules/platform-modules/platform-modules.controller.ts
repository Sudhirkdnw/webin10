import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PlatformModulesService } from './platform-modules.service';
import { CreatePlatformModuleDto } from './dto/create-module.dto';
import { UpdatePlatformModuleDto } from './dto/update-module.dto';
import { JwtPlatformGuard } from '@/common/guards/jwt-platform.guard';
import { PlatformRoleGuard } from '@/common/guards/platform-role.guard';
import { RequirePlatformRoles } from '@/common/decorators/require-roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PlatformRole, AuthenticatedUser } from '@webin10/shared-types';

@ApiTags('Super Admin Platform Modules')
@ApiBearerAuth()
@UseGuards(JwtPlatformGuard, PlatformRoleGuard)
@Controller('super-admin/modules')
export class PlatformModulesController {
  constructor(private readonly modulesService: PlatformModulesService) {}

  @Get()
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
    PlatformRole.PLATFORM_SUPPORT,
    PlatformRole.PLATFORM_OPERATIONS,
  )
  @ApiOperation({ summary: 'List all registered platform functional modules' })
  async list() {
    return this.modulesService.listModules();
  }

  @Get(':id')
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Get module details and assigned categories' })
  async getById(@Param('id') id: string) {
    return this.modulesService.getModuleById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Register a new platform functional module metadata' })
  async create(
    @Body() dto: CreatePlatformModuleDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.modulesService.createModule(dto, admin.id, ip);
  }

  @Patch(':id')
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Update platform module metadata or toggle active status' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePlatformModuleDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.modulesService.updateModule(id, dto, admin.id, ip);
  }

  @Post('categories/:categoryId/toggle')
  @HttpCode(HttpStatus.OK)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Toggle default assignment of a module to a business category' })
  async toggleCategoryDefault(
    @Param('categoryId') categoryId: string,
    @Body() dto: { moduleId: string; isDefault: boolean },
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.modulesService.toggleCategoryDefault(categoryId, dto.moduleId, dto.isDefault, admin.id, ip);
  }
}

