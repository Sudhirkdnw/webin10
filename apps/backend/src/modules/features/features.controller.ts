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
import { FeaturesService } from './features.service';
import { CreateFeatureFlagDto } from './dto/create-feature.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature.dto';
import { TenantFeatureOverrideDto } from './dto/tenant-feature-override.dto';
import { JwtPlatformGuard } from '@/common/guards/jwt-platform.guard';
import { PlatformRoleGuard } from '@/common/guards/platform-role.guard';
import { RequirePlatformRoles } from '@/common/decorators/require-roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PlatformRole, AuthenticatedUser } from '@webin10/shared-types';

@ApiTags('Super Admin Feature Flags')
@ApiBearerAuth()
@UseGuards(JwtPlatformGuard, PlatformRoleGuard)
@Controller('super-admin/features')
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  @Get()
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
    PlatformRole.PLATFORM_SUPPORT,
    PlatformRole.PLATFORM_OPERATIONS,
  )
  @ApiOperation({ summary: 'List all platform-level feature flags' })
  async list() {
    return this.featuresService.listFeatures();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Create a new feature flag definition' })
  async create(
    @Body() dto: CreateFeatureFlagDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.featuresService.createFeature(dto, admin.id, ip);
  }

  @Patch(':id')
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Update feature flag global status or metadata' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFeatureFlagDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.featuresService.updateFeature(id, dto, admin.id, ip);
  }

  @Post('override')
  @HttpCode(HttpStatus.OK)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Set or update an individual tenant feature flag override' })
  async setOverride(
    @Body() dto: TenantFeatureOverrideDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.featuresService.setTenantOverride(dto, admin.id, ip);
  }

  @Get('tenant/:tenantId')
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER, PlatformRole.PLATFORM_SUPPORT)
  @ApiOperation({ summary: 'Resolve effective feature flags for a tenant (Platform Defaults + Overrides)' })
  async resolveForTenant(@Param('tenantId') tenantId: string) {
    return this.featuresService.resolveEffectiveFeatures(tenantId);
  }
}
