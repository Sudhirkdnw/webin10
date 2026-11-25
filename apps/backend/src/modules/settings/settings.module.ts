import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { PublicBrandingController } from './public-branding.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, MailModule, AuditModule],
  controllers: [SettingsController, PublicBrandingController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
