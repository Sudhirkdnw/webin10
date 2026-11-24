import { z } from 'zod';

export const CreateTenantSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters').max(100),
  categorySlug: z.string().min(2, 'Category is required'),
  ownerEmail: z.string().email('Invalid email address'),
  ownerPhone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number (+91 format, 10 digits)'),
  ownerName: z.string().min(2, 'Owner name is required'),
  planId: z.string().uuid('Invalid plan ID').optional(),
  branchName: z.string().default('Main Branch'),
});

export type CreateTenantDto = z.infer<typeof CreateTenantSchema>;

export const SuspendTenantSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export type SuspendTenantDto = z.infer<typeof SuspendTenantSchema>;
