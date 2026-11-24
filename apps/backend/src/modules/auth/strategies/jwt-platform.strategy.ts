import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { JwtPlatformPayload, AuthenticatedUser } from '@webin10/shared-types';

@Injectable()
export class JwtPlatformStrategy extends PassportStrategy(Strategy, 'jwt-platform') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || 'super-secret-access-key-replace-in-production-min-32-chars',
    });
  }

  async validate(payload: JwtPlatformPayload): Promise<AuthenticatedUser> {
    if (!payload.isPlatformAdmin || !payload.sub) {
      throw new UnauthorizedException('Invalid platform token');
    }

    const admin = await this.prisma.platformAdmin.findUnique({
      where: { id: payload.sub },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Platform administrator account is suspended or inactive');
    }

    return {
      id: admin.id,
      email: admin.email,
      platformRole: admin.role as any,
      isPlatformAdmin: true,
    };
  }
}
