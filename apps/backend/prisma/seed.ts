import { PrismaClient, PlatformRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Webin10 Platform Baseline Data ---');

  // 1. Seed Super Admin
  const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@webin10.com';
  const rawPassword = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMeInProduction123!';
  const passwordHash = await bcrypt.hash(rawPassword, 12);

  const superAdmin = await prisma.platformAdmin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Super Admin',
      passwordHash,
      role: PlatformRole.PLATFORM_OWNER,
      isActive: true,
      mfaEnabled: false,
    },
  });
  console.log(`✓ Super Admin created: ${superAdmin.email}`);

  // 2. Seed Default Business Categories
  const categories = [
    { name: 'Gym & Fitness', slug: 'gym', description: 'Gyms, Fitness Studios and Personal Training' },
    { name: 'Coaching & Tuition', slug: 'coaching', description: 'Coaching institutes, Tuition centers and Academies' },
    { name: 'Salon & Spa', slug: 'salon', description: 'Salons, Spas, and Personal Grooming Centers' },
    { name: 'Dance & Music Academy', slug: 'dance-academy', description: 'Dance, Music and Arts academies' },
  ];

  for (const cat of categories) {
    const category = await prisma.businessCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    console.log(`✓ Category seeded: ${category.name}`);
  }

  // 3. Seed Platform Modules
  const modules = [
    { key: 'crm', name: 'Customer CRM', description: 'Customer management and profiles' },
    { key: 'memberships', name: 'Memberships', description: 'Recurring membership plans and renewal' },
    { key: 'courses', name: 'Courses & Batches', description: 'Course management and student batches' },
    { key: 'attendance', name: 'Attendance & QR', description: 'Attendance tracking and QR code check-in' },
    { key: 'billing', name: 'Billing & Invoices', description: 'Invoicing, receipts and payment tracking' },
    { key: 'staff', name: 'Staff Management', description: 'Staff accounts, roles and permissions' },
    { key: 'automation', name: 'Business Automation', description: 'Automated WhatsApp reminders and alerts' },
    { key: 'reports', name: 'Reports & Analytics', description: 'Revenue and operational analytics' },
  ];

  for (const mod of modules) {
    const moduleRecord = await prisma.platformModule.upsert({
      where: { key: mod.key },
      update: {},
      create: mod,
    });
    console.log(`✓ Platform Module seeded: ${moduleRecord.name}`);
  }

  // 4. Seed Default Subscription Plans
  const plans = [
    {
      name: 'Starter',
      slug: 'starter',
      priceMonthly: 49900, // ₹499.00 in paise
      maxCustomers: 100,
      maxStaff: 2,
      maxBranches: 1,
      description: 'Ideal for small gyms, tuition teachers, and single-chair salons.',
    },
    {
      name: 'Growth',
      slug: 'growth',
      priceMonthly: 99900, // ₹999.00 in paise
      maxCustomers: 500,
      maxStaff: 5,
      maxBranches: 2,
      description: 'Ideal for growing fitness studios and coaching centres.',
    },
    {
      name: 'Professional',
      slug: 'professional',
      priceMonthly: 199900, // ₹1,999.00 in paise
      maxCustomers: 2000,
      maxStaff: 15,
      maxBranches: 5,
      description: 'Full-featured power plan for multi-branch businesses.',
    },
  ];

  for (const plan of plans) {
    const planRecord = await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: plan,
    });
    console.log(`✓ Subscription Plan seeded: ${planRecord.name} (₹${planRecord.priceMonthly / 100}/mo)`);
  }

  console.log('--- Baseline Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
