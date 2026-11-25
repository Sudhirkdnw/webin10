import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './settings.service';

@ApiTags('Public - Platform Branding')
@Controller('public/branding')
export class PublicBrandingController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get public platform branding and theme settings (No auth required)' })
  async getBranding() {
    return this.settingsService.getPublicBranding();
  }
}
