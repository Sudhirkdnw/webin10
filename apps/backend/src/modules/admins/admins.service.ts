import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreatePlatformAdminDto } from './dto/create-admin.dto';
import { UpdatePlatformAdminDto } from './dto/update-admin.dto';

@Injectable()
export class AdminsService {
  private readonly logger = new Logger(AdminsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listAdmins() {
    return this.prisma.platformAdmin.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mfaEnabled: true,
        createdAt: true,
        _count: { select: { sessions: true } },
      },
    });
  }

  async createAdmin(dto: CreatePlatformAdminDto, currentAdminId: string, ip?: string) {
    const existing = await this.prisma.platformAdmin.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException(`Administrator with email '${dto.email}' already exists`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const admin = await this.prisma.platformAdmin.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        name: dto.name,
        role: dto.role as any,
        isActive: true,
        mfaEnabled: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mfaEnabled: true,
        createdAt: true,
      },
    });

    await this.auditService.log({
      actorId: currentAdminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'admin.create',
      entity: 'platform_admins',
      entityId: admin.id,
      details: { email: admin.email, role: admin.role },
      ipAddress: ip,
    });

    return admin;
  }

  async updateAdmin(id: string, dto: UpdatePlatformAdminDto, currentAdminId: string, ip?: string) {
    const admin = await this.prisma.platformAdmin.findUnique({ where: { id } });
    if (!admin) {
      throw new NotFoundException(`Administrator with ID '${id}' not found`);
    }

    // Protect last PLATFORM_OWNER from demotion or deactivation
    if (admin.role === 'PLATFORM_OWNER' && (dto.role !== undefined || dto.isActive === false)) {
      const ownerCount = await this.prisma.platformAdmin.count({
        where: { role: 'PLATFORM_OWNER', isActive: true },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot deactivate or modify the primary Platform Owner account');
      }
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    const updated = await this.prisma.platformAdmin.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mfaEnabled: true,
        updatedAt: true,
      },
    });

    await this.auditService.log({
      actorId: currentAdminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'admin.update',
      entity: 'platform_admins',
      entityId: id,
      details: { role: dto.role, isActive: dto.isActive, passwordChanged: !!dto.password },
      ipAddress: ip,
    });

    return updated;
  }
}
