export enum PlatformRole {
  PLATFORM_OWNER = 'PLATFORM_OWNER',
  SUPER_ADMIN = 'SUPER_ADMIN',
  PLATFORM_SUPPORT = 'PLATFORM_SUPPORT',
  PLATFORM_FINANCE = 'PLATFORM_FINANCE',
  PLATFORM_OPERATIONS = 'PLATFORM_OPERATIONS',
  PLATFORM_ANALYST = 'PLATFORM_ANALYST',
}

export enum TenantRole {
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  BUSINESS_MANAGER = 'BUSINESS_MANAGER',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  RECEPTIONIST = 'RECEPTIONIST',
  TRAINER = 'TRAINER',
  TEACHER = 'TEACHER',
  ACCOUNTANT = 'ACCOUNTANT',
  CUSTOM_STAFF = 'CUSTOM_STAFF',
}

export type PermissionString =
  | 'customers.read'
  | 'customers.create'
  | 'customers.update'
  | 'customers.archive'
  | 'staff.read'
  | 'staff.create'
  | 'staff.update'
  | 'payments.read'
  | 'payments.create'
  | 'payments.refund'
  | 'invoices.read'
  | 'invoices.create'
  | 'attendance.read'
  | 'attendance.create'
  | 'reports.read'
  | 'settings.update'
  | 'automation.read'
  | 'automation.create'
  | 'automation.manage'
  | 'platform.manage'
  | 'platform.support_access';
