import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole } from '@webin10/shared-types';
import { PLATFORM_ROLES_KEY } from '../decorators/require-roles.decorator';

@Injectable()
export class PlatformRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<PlatformRole[]>(
      PLATFORM_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.isPlatformAdmin) {
      throw new ForbiddenException('Platform administrator privileges required');
    }

    // PLATFORM_OWNER has super-access to all platform roles
    if (user.platformRole === PlatformRole.PLATFORM_OWNER) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.platformRole);
    if (!hasRole) {
      throw new ForbiddenException(`Insufficient platform role. Required: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
