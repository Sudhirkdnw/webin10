import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { PlatformModulesModule } from './modules/platform-modules/platform-modules.module';
import { FeaturesModule } from './modules/features/features.module';
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
    HealthModule,
  ],
})
export class AppModule {}
