import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtPlatformGuard } from '@/common/guards/jwt-platform.guard';
import { PlatformRoleGuard } from '@/common/guards/platform-role.guard';
import { RequirePlatformRoles } from '@/common/decorators/require-roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PlatformRole, AuthenticatedUser } from '@webin10/shared-types';
import { SettingsService } from './settings.service';
import { UpdateSettingDto, TestSmtpDto } from './dto/update-settings.dto';

@ApiTags('Super Admin - System Settings')
@ApiBearerAuth()
@UseGuards(JwtPlatformGuard, PlatformRoleGuard)
@Controller('super-admin/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all system settings groups' })
  @RequirePlatformRoles(PlatformRole.PLATFORM_OWNER, PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OPERATIONS)
  async getAll() {
    return this.settingsService.getAllSettings();
  }

  @Get(':group')
  @ApiOperation({ summary: 'Get settings for a specific group' })
  @RequirePlatformRoles(PlatformRole.PLATFORM_OWNER, PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OPERATIONS)
  async getByGroup(@Param('group') group: string) {
    return this.settingsService.getSettingByGroup(group);
  }

  @Put(':group')
  @ApiOperation({ summary: 'Update settings for a specific group' })
  @RequirePlatformRoles(PlatformRole.PLATFORM_OWNER, PlatformRole.SUPER_ADMIN)
  async update(
    @Param('group') group: string,
    @Body() dto: UpdateSettingDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return this.settingsService.updateSetting(group, dto, admin.id, ip);
  }

  @Post('mail/test')
  @ApiOperation({ summary: 'Test SMTP connection and optionally send a test email' })
  @RequirePlatformRoles(PlatformRole.PLATFORM_OWNER, PlatformRole.SUPER_ADMIN)
  async testMail(@Body() dto: TestSmtpDto) {
    return this.settingsService.testSmtp(dto);
  }

  @Post('actions/upgrade-database')
  @ApiOperation({ summary: 'Execute database schema sync and connectivity verification' })
  @RequirePlatformRoles(PlatformRole.PLATFORM_OWNER, PlatformRole.SUPER_ADMIN)
  async upgradeDatabase(@CurrentUser() admin: AuthenticatedUser, @Ip() ip: string) {
    return this.settingsService.upgradeDatabase(admin.id, ip);
  }

  @Post('actions/generate-sitemap')
  @ApiOperation({ summary: 'Generate dynamic platform sitemap XML' })
  @RequirePlatformRoles(PlatformRole.PLATFORM_OWNER, PlatformRole.SUPER_ADMIN)
  async generateSitemap(@CurrentUser() admin: AuthenticatedUser, @Ip() ip: string) {
    return this.settingsService.generateSitemap(admin.id, ip);
  }
}
