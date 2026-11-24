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
import { AdminsService } from './admins.service';
import { CreatePlatformAdminDto } from './dto/create-admin.dto';
import { UpdatePlatformAdminDto } from './dto/update-admin.dto';
import { JwtPlatformGuard } from '@/common/guards/jwt-platform.guard';
import { PlatformRoleGuard } from '@/common/guards/platform-role.guard';
import { RequirePlatformRoles } from '@/common/decorators/require-roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PlatformRole, AuthenticatedUser } from '@webin10/shared-types';

@ApiTags('Super Admin Platform Team & Governance')
@ApiBearerAuth()
@UseGuards(JwtPlatformGuard, PlatformRoleGuard)
@Controller('super-admin/admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get()
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'List all authorized platform administrators and roles' })
  async list() {
    return this.adminsService.listAdmins();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePlatformRoles(PlatformRole.PLATFORM_OWNER, PlatformRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new authorized platform administrator account' })
  async create(
    @Body() dto: CreatePlatformAdminDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.adminsService.createAdmin(dto, admin.id, ip);
  }

  @Patch(':id')
  @RequirePlatformRoles(PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Update administrator role, password, or toggle active status' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePlatformAdminDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.adminsService.updateAdmin(id, dto, admin.id, ip);
  }
}
