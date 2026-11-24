import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { IntegrationsService } from './integrations.service';
import { ConfigureIntegrationDto, IntegrationProviderEnum } from './dto/configure-integration.dto';
import { JwtPlatformGuard } from '@/common/guards/jwt-platform.guard';
import { PlatformRoleGuard } from '@/common/guards/platform-role.guard';
import { RequirePlatformRoles } from '@/common/decorators/require-roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PlatformRole, AuthenticatedUser } from '@webin10/shared-types';

@ApiTags('Super Admin Platform Integrations')
@ApiBearerAuth()
@UseGuards(JwtPlatformGuard, PlatformRoleGuard)
@Controller('super-admin/integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
    PlatformRole.PLATFORM_OPERATIONS,
    PlatformRole.PLATFORM_FINANCE,
  )
  @ApiOperation({ summary: 'List all supported payment & communication integration gateways and their health' })
  async list() {
    return this.integrationsService.listIntegrations();
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Configure API credentials and settings for an integration gateway' })
  async configure(
    @Body() dto: ConfigureIntegrationDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.integrationsService.configureIntegration(dto, admin.id, ip);
  }

  @Post(':provider/test')
  @HttpCode(HttpStatus.OK)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER, PlatformRole.PLATFORM_OPERATIONS)
  @ApiOperation({ summary: 'Trigger a live health check test against provider gateway' })
  async test(
    @Param('provider') provider: IntegrationProviderEnum,
    @Body() body?: any,
  ) {
    return this.integrationsService.testConnection(provider, body);
  }
}
