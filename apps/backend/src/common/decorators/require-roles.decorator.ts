import { SetMetadata } from '@nestjs/common';
import { PlatformRole } from '@webin10/shared-types';

export const PLATFORM_ROLES_KEY = 'platform_roles';
export const RequirePlatformRoles = (...roles: PlatformRole[]) =>
  SetMetadata(PLATFORM_ROLES_KEY, roles);
