import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { MailModule } from '@/modules/mail/mail.module';
import { WhatsAppModule } from '@/modules/whatsapp/whatsapp.module';

@Module({
  imports: [PrismaModule, AuditModule, MailModule, WhatsAppModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
