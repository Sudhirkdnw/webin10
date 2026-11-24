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
import { SupportService } from './support.service';
import { CreateSupportAccessRequestDto } from './dto/create-support-request.dto';
import { JwtPlatformGuard } from '@/common/guards/jwt-platform.guard';
import { PlatformRoleGuard } from '@/common/guards/platform-role.guard';
import { RequirePlatformRoles } from '@/common/decorators/require-roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PlatformRole, AuthenticatedUser } from '@webin10/shared-types';

@ApiTags('Super Admin Privileged Support Access')
@ApiBearerAuth()
@UseGuards(JwtPlatformGuard, PlatformRoleGuard)
@Controller('super-admin/support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('requests')
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
    PlatformRole.PLATFORM_SUPPORT,
  )
  @ApiOperation({ summary: 'List all audited time-limited privileged support access sessions' })
  async list() {
    return this.supportService.listRequests();
  }

  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER, PlatformRole.PLATFORM_SUPPORT)
  @ApiOperation({ summary: 'Request audited time-limited support session for a tenant' })
  async create(
    @Body() dto: CreateSupportAccessRequestDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.supportService.createRequest(dto, admin.id, ip);
  }

  @Post('requests/:id/revoke')
  @HttpCode(HttpStatus.OK)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Immediately terminate and revoke a support access session' })
  async revoke(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.supportService.revokeRequest(id, admin.id, ip);
  }
}
