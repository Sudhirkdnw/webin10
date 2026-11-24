import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { DashboardController } from './dashboard.controller';

@Global()
@Module({
  controllers: [DashboardController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
