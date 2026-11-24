import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateSupportAccessRequestDto } from './dto/create-support-request.dto';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listRequests() {
    return this.prisma.supportAccessRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        admin: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  async createRequest(dto: CreateSupportAccessRequestDto, adminId: string, ip?: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: dto.tenantId } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${dto.tenantId}' not found`);
    }

    const duration = dto.durationHours || 2;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + duration);

    // Platform Owners / Super Admins get immediate authorized support session
    const request = await this.prisma.supportAccessRequest.create({
      data: {
        tenantId: dto.tenantId,
        adminId,
        reason: dto.reason,
        durationHours: duration,
        status: 'APPROVED',
        expiresAt,
        approvedById: adminId,
      },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        admin: { select: { id: true, name: true, email: true } },
      },
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      tenantId: dto.tenantId,
      action: 'support.access_granted',
      entity: 'support_access_requests',
      entityId: request.id,
      details: {
        tenantSlug: tenant.slug,
        reason: dto.reason,
        durationHours: duration,
        expiresAt,
      },
      ipAddress: ip,
    });

    return request;
  }

  async revokeRequest(id: string, adminId: string, ip?: string) {
    const request = await this.prisma.supportAccessRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Support access request '${id}' not found`);
    }

    if (request.status === 'REVOKED') {
      throw new BadRequestException('Support session is already revoked');
    }

    const updated = await this.prisma.supportAccessRequest.update({
      where: { id },
      data: { status: 'REVOKED' },
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      tenantId: request.tenantId,
      action: 'support.access_revoked',
      entity: 'support_access_requests',
      entityId: id,
      details: { previousStatus: request.status },
      ipAddress: ip,
    });

    return { id: updated.id, status: updated.status, message: 'Support access session revoked successfully' };
  }
}
