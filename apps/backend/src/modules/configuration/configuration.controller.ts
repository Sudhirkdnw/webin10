import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { ConfigurationService } from './configuration.service';
import { CreateConfigurationDefinitionDto } from './dto/create-definition.dto';
import { SetConfigurationValueDto } from './dto/set-config-value.dto';
import { RollbackConfigurationDto } from './dto/rollback-config.dto';
import { JwtPlatformGuard } from '@/common/guards/jwt-platform.guard';
import { PlatformRoleGuard } from '@/common/guards/platform-role.guard';
import { RequirePlatformRoles } from '@/common/decorators/require-roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PlatformRole, AuthenticatedUser } from '@webin10/shared-types';

@ApiTags('Super Admin Dynamic Configurations')
@ApiBearerAuth()
@UseGuards(JwtPlatformGuard, PlatformRoleGuard)
@Controller('super-admin/configurations')
export class ConfigurationController {
  constructor(private readonly configService: ConfigurationService) {}

  @Get()
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
    PlatformRole.PLATFORM_OPERATIONS,
    PlatformRole.PLATFORM_SUPPORT,
  )
  @ApiOperation({ summary: 'List all configuration definitions and platform defaults' })
  async listDefinitions() {
    return this.configService.listDefinitions();
  }

  @Post('definitions')
  @HttpCode(HttpStatus.CREATED)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Define a new dynamic configuration key' })
  async createDefinition(
    @Body() dto: CreateConfigurationDefinitionDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.configService.createDefinition(dto, admin.id, ip);
  }

  @Patch(':key')
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER, PlatformRole.PLATFORM_OPERATIONS)
  @ApiOperation({ summary: 'Update configuration value (with automatic version increment & history)' })
  async setValue(
    @Param('key') key: string,
    @Body() dto: SetConfigurationValueDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.configService.setValue(key, dto, admin.id, ip);
  }

  @Get(':key/versions')
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER, PlatformRole.PLATFORM_OPERATIONS)
  @ApiOperation({ summary: 'Get full audit version history for a configuration key' })
  async getVersions(
    @Param('key') key: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.configService.getVersionHistory(key, tenantId);
  }

  @Post(':key/rollback')
  @HttpCode(HttpStatus.OK)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Rollback configuration key to a specific version number' })
  async rollback(
    @Param('key') key: string,
    @Body() dto: RollbackConfigurationDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.configService.rollback(key, dto, admin.id, ip);
  }

  @Get('effective/:tenantId')
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER, PlatformRole.PLATFORM_SUPPORT)
  @ApiOperation({ summary: 'Resolve effective configuration hierarchy for a specific tenant' })
  async resolveEffective(@Param('tenantId') tenantId: string) {
    return this.configService.resolveEffectiveConfig(tenantId);
  }
}
