import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { TenantSelfService } from './tenant-self-service.service';
import { TenantSelfServiceController } from './tenant-self-service.controller';
import { TenantRegistrationService } from './tenant-registration.service';
import { TenantRegistrationController } from './tenant-registration.controller';
import { MailModule } from '../mail/mail.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [MailModule, WhatsAppModule],
  controllers: [
    TenantsController,
    TenantSelfServiceController,
    TenantRegistrationController,
  ],
  providers: [
    TenantsService,
    TenantSelfService,
    TenantRegistrationService,
  ],
  exports: [
    TenantsService,
    TenantSelfService,
    TenantRegistrationService,
  ],
})
export class TenantsModule {}
