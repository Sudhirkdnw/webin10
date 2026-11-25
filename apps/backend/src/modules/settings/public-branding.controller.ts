import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SettingsService, DEFAULT_MAINTENANCE_SETTINGS } from './settings.service';

@ApiTags('Public - Platform Branding & Status')
@Controller('public')
export class PublicBrandingController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('branding')
  @ApiOperation({ summary: 'Get public platform branding and theme settings (No auth required)' })
  async getBranding() {
    return this.settingsService.getPublicBranding();
  }

  @Get('platform-status')
  @ApiOperation({ summary: 'Get platform maintenance mode and system status (No auth required)' })
  async getStatus() {
    const maintenance = await this.settingsService.getSettingByGroup('maintenance');
    return {
      maintenance: {
        ...DEFAULT_MAINTENANCE_SETTINGS,
        ...(maintenance?.value || {}),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
