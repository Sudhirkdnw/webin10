import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { PlatformModulesModule } from './modules/platform-modules/platform-modules.module';
import { FeaturesModule } from './modules/features/features.module';
import { PlansModule } from './modules/plans/plans.module';
import { ConfigurationModule } from './modules/configuration/configuration.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { SupportModule } from './modules/support/support.module';
import { AdminsModule } from './modules/admins/admins.module';
import { HealthModule } from './modules/health/health.module';
import { MailModule } from './modules/mail/mail.module';
import { SettingsModule } from './modules/settings/settings.module';
import { EmailTemplatesModule } from './modules/email-templates/email-templates.module';
import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    TenantsModule,
    CategoriesModule,
    PlatformModulesModule,
    FeaturesModule,
    PlansModule,
    ConfigurationModule,
    IntegrationsModule,
    SupportModule,
    AdminsModule,
    HealthModule,
    MailModule,
    SettingsModule,
    EmailTemplatesModule,
    UploadsModule,
  ],
})
export class AppModule {}
