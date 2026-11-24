import { Module } from '@nestjs/common';
import { LogRetentionService } from './log-retention.service';
import { LogRetentionController } from './log-retention.controller';
import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LogRetentionController],
  providers: [LogRetentionService],
  exports: [LogRetentionService],
})
export class LogRetentionModule {}
