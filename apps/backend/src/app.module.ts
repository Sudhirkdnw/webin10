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
import { HealthModule } from './modules/health/health.module';

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
    HealthModule,
  ],
})
export class AppModule {}
