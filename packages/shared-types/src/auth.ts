import { PlatformRole, TenantRole } from './roles';

export interface JwtPlatformPayload {
  sub: string; // admin user ID
  email: string;
  role: PlatformRole;
  isPlatformAdmin: true;
}

export interface JwtTenantPayload {
  sub: string; // user ID
  email?: string;
  phone?: string;
  tenantId: string;
  role: TenantRole;
  branchId?: string;
  permissions: string[];
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  phone?: string;
  platformRole?: PlatformRole;
  tenantId?: string;
  tenantRole?: TenantRole;
  branchId?: string;
  permissions?: string[];
  isPlatformAdmin: boolean;
}
