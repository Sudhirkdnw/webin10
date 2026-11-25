import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
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
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { ListAnnouncementsDto } from './dto/list-announcements.dto';
import { JwtPlatformGuard } from '@/common/guards/jwt-platform.guard';
import { PlatformRoleGuard } from '@/common/guards/platform-role.guard';
import { RequirePlatformRoles } from '@/common/decorators/require-roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PlatformRole, AuthenticatedUser } from '@webin10/shared-types';

@ApiTags('Platform Announcements & Broadcast Banners')
@Controller()
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  // -------------------------------------------------------------
  // 1. SUPER ADMIN ENDPOINTS (Protected by Platform Auth)
  // -------------------------------------------------------------

  @Get('super-admin/announcements')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
    PlatformRole.PLATFORM_OPERATIONS,
    PlatformRole.PLATFORM_SUPPORT,
  )
  @ApiOperation({ summary: 'List all announcements with filters and live status' })
  async listAnnouncements(@Query() query: ListAnnouncementsDto) {
    return this.announcementsService.findAll(query);
  }

  @Post('super-admin/announcements')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create and broadcast a new platform-wide announcement banner' })
  async createAnnouncement(
    @Body() dto: CreateAnnouncementDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.announcementsService.createAnnouncement(dto, admin.id, ip);
  }

  @Get('super-admin/announcements/:id')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Get details of a single announcement banner' })
  async getOne(@Param('id') id: string) {
    return this.announcementsService.findOne(id);
  }

  @Put('super-admin/announcements/:id')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Update an existing announcement banner' })
  async updateAnnouncement(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.announcementsService.updateAnnouncement(id, dto, admin.id, ip);
  }

  @Patch('super-admin/announcements/:id/toggle')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Quick toggle active/inactive status of an announcement' })
  async toggleActive(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.announcementsService.toggleActive(id, admin.id, ip);
  }

  @Delete('super-admin/announcements/:id')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Permanently delete an announcement' })
  async deleteAnnouncement(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.announcementsService.deleteAnnouncement(id, admin.id, ip);
  }

  // -------------------------------------------------------------
  // 2. BUSINESS TENANT (GYM OWNERS) LIVE ENDPOINT
  // -------------------------------------------------------------

  @Get('tenants/announcements/active')
  @ApiOperation({ summary: 'Fetch currently active announcements for a business tenant workspace' })
  async getActiveForTenant(@Query('tenantId') tenantId?: string) {
    return this.announcementsService.getActiveForTenant(tenantId);
  }
}
