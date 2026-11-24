import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

export interface CreateAuditLogParams {
  actorId: string;
  actorType: 'PLATFORM_ADMIN' | 'TENANT_USER' | 'SYSTEM';
  tenantId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: CreateAuditLogParams) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: params.actorId,
          actorType: params.actorType,
          tenantId: params.tenantId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          details: params.details ? JSON.parse(JSON.stringify(params.details)) : undefined,
          ipAddress: params.ipAddress,
        },
      });
    } catch (error) {
      // Audit failure should not crash business operations, but must be logged prominently
      this.logger.error(`Failed to write audit log: ${params.action}`, error);
    }
  }
}
