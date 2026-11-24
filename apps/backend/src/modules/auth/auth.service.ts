import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { SuperAdminLoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { JwtPlatformPayload, PlatformRole } from '@webin10/shared-types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async loginSuperAdmin(dto: SuperAdminLoginDto, ip?: string, userAgent?: string) {
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid platform credentials');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Platform administrator account is suspended');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!isPasswordValid) {
      // Record failed login audit
      await this.auditService.log({
        actorId: admin.id,
        actorType: 'PLATFORM_ADMIN',
        action: 'auth.login_failed',
        entity: 'platform_admins',
        entityId: admin.id,
        details: { reason: 'invalid_password' },
        ipAddress: ip,
      });
      throw new UnauthorizedException('Invalid platform credentials');
    }

    // MFA Check if enabled
    if (admin.mfaEnabled && !dto.mfaCode) {
      return {
        mfaRequired: true,
        message: 'Two-factor authentication code required',
      };
    }

    // Generate tokens
    const tokens = await this.generatePlatformTokens({
      sub: admin.id,
      email: admin.email,
      role: admin.role as PlatformRole,
      isPlatformAdmin: true,
    });

    // Hash refresh token and persist in session
    const tokenHash = this.hashToken(tokens.refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.platformSession.create({
      data: {
        adminId: admin.id,
        tokenHash,
        ipAddress: ip,
        userAgent,
        expiresAt,
      },
    });

    // Record successful login audit
    await this.auditService.log({
      actorId: admin.id,
      actorType: 'PLATFORM_ADMIN',
      action: 'auth.login_success',
      entity: 'platform_admins',
      entityId: admin.id,
      ipAddress: ip,
    });

    return {
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        mfaEnabled: admin.mfaEnabled,
      },
      tokens,
    };
  }

  async refreshPlatformToken(dto: RefreshTokenDto, ip?: string, userAgent?: string) {
    let payload: JwtPlatformPayload;
    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'super-secret-refresh-key-replace-in-production-min-32-chars',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!payload.isPlatformAdmin || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const tokenHash = this.hashToken(dto.refreshToken);

    // Verify session exists
    const session = await this.prisma.platformSession.findFirst({
      where: {
        adminId: payload.sub,
        tokenHash,
        expiresAt: { gt: new Date() },
      },
      include: { admin: true },
    });

    if (!session || !session.admin || !session.admin.isActive) {
      // Possible token reuse or revoked session! Revoke all sessions for security
      if (payload.sub) {
        await this.prisma.platformSession.deleteMany({
          where: { adminId: payload.sub },
        });
      }
      throw new UnauthorizedException('Session expired or revoked. Please login again.');
    }

    // Refresh Token Rotation: Delete old session and create a new one
    await this.prisma.platformSession.delete({
      where: { id: session.id },
    });

    const newTokens = await this.generatePlatformTokens({
      sub: session.admin.id,
      email: session.admin.email,
      role: session.admin.role as PlatformRole,
      isPlatformAdmin: true,
    });

    const newTokenHash = this.hashToken(newTokens.refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.platformSession.create({
      data: {
        adminId: session.admin.id,
        tokenHash: newTokenHash,
        ipAddress: ip,
        userAgent,
        expiresAt,
      },
    });

    return newTokens;
  }

  async logoutPlatform(adminId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.platformSession.deleteMany({
        where: { adminId, tokenHash },
      });
    } else {
      // Logout all sessions
      await this.prisma.platformSession.deleteMany({
        where: { adminId },
      });
    }

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'auth.logout',
      entity: 'platform_admins',
      entityId: adminId,
    });

    return { message: 'Logged out successfully' };
  }

  async getPlatformProfile(adminId: string) {
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      throw new UnauthorizedException('Administrator not found');
    }

    return admin;
  }

  async updateProfile(adminId: string, dto: { name: string; avatarUrl?: string }, ip?: string) {
    const updated = await this.prisma.platformAdmin.update({
      where: { id: adminId },
      data: {
        name: dto.name,
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        mfaEnabled: true,
        updatedAt: true,
      },
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'profile.update',
      entity: 'platform_admins',
      entityId: adminId,
      details: { newName: dto.name, avatarUrl: dto.avatarUrl },
      ipAddress: ip,
    });

    return updated;
  }

  async changePassword(adminId: string, dto: { currentPassword: string; newPassword: string }, ip?: string) {
    const admin = await this.prisma.platformAdmin.findUnique({ where: { id: adminId } });
    if (!admin) {
      throw new UnauthorizedException('Administrator not found');
    }

    const isValid = await bcrypt.compare(dto.currentPassword, admin.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Current password does not match');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.platformAdmin.update({
      where: { id: adminId },
      data: { passwordHash: newHash },
    });

    // Revoke all other active sessions for this admin (force re-login on other devices)
    await this.prisma.platformSession.deleteMany({
      where: { adminId },
    });

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      action: 'profile.password_change',
      entity: 'platform_admins',
      entityId: adminId,
      ipAddress: ip,
    });

    return { message: 'Password changed successfully. Please login again with your new credentials.' };
  }

  async getSessions(adminId: string) {
    return this.prisma.platformSession.findMany({
      where: {
        adminId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }

  async revokeSession(adminId: string, sessionId: string) {
    await this.prisma.platformSession.deleteMany({
      where: { id: sessionId, adminId },
    });
    return { message: 'Session revoked successfully' };
  }

  private async generatePlatformTokens(payload: JwtPlatformPayload) {
    const accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'super-secret-access-key-replace-in-production-min-32-chars';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'super-secret-refresh-key-replace-in-production-min-32-chars';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 mins in seconds
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
