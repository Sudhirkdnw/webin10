export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_ONBOARDING = 'PENDING_ONBOARDING',
  DEACTIVATED = 'DEACTIVATED',
}

export enum BusinessCategoryType {
  GYM = 'GYM',
  FITNESS_STUDIO = 'FITNESS_STUDIO',
  YOGA_STUDIO = 'YOGA_STUDIO',
  COACHING_CENTRE = 'COACHING_CENTRE',
  TUITION_CENTRE = 'TUITION_CENTRE',
  DANCE_ACADEMY = 'DANCE_ACADEMY',
  SALON = 'SALON',
  SPA = 'SPA',
  CUSTOM = 'CUSTOM',
}

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
}
