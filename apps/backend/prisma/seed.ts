import * as dotenv from 'dotenv';
import * as path from 'path';

// 1. Load environment variables before initializing PrismaClient
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

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

  // 5. Seed System Settings (All Groups matching UI specification)
  const defaultSettings: Array<{ group: string; key: string; value: any; isPublic?: boolean }> = [
    // General Settings (matching screenshot)
    {
      group: 'general',
      key: 'general_settings',
      isPublic: true,
      value: {
        appName: 'Webin10',
        email: 'webin10.in@gmail.com',
        phone: '+91 7070799200',
        planExpireNotificationDays: 5,
        address: 'Narkatiaganj, West Champaran, Bihar, 845455',
        defaultLanguage: 'English',
        userDefaultLanguage: 'English',
        dateTimeFormat: 'Day Month, Year',
        defaultCountryCode: 'in',
        defaultCurrencyFormat: '₹ - INR Indian Rupee',
        affiliationAmount: 10,
        affiliationType: 'Fix Amount',
        timezone: 'UTC',
        blockEmailDomains: 'tempmail.com, 10minutemail.com, maildrop.cc, throwawaymail.com',
        showCurrencyBehind: false,
        allowEditVcardAlias: false,
        nfcLogoRequired: true,
        enablePhoneValidation: true,
        hideDecimalValues: false,
      },
    },
    // Terms & Conditions
    {
      group: 'terms',
      key: 'terms_settings',
      isPublic: true,
      value: {
        termsAndConditions: 'Welcome to Webin10. By accessing or using our SaaS platform, you agree to comply with our Master Service Agreement...',
        privacyPolicy: 'Webin10 respects user data privacy in compliance with Indian IT Rules and standard data privacy frameworks...',
        refundPolicy: 'Subscriptions may be canceled at any time prior to the billing cycle renewal. Pro-rated refunds are evaluated as per policy...',
      },
    },
    // Google Configuration
    {
      group: 'google',
      key: 'google_settings',
      isPublic: false,
      value: {
        clientId: '',
        clientSecret: '',
        mapsApiKey: '',
        analyticsTagId: '',
      },
    },
    // Payment Configuration
    {
      group: 'payment',
      key: 'payment_settings',
      isPublic: false,
      value: {
        defaultCurrency: 'INR',
        taxPercentage: 18,
        upiId: 'webin10@upi',
        razorpayEnabled: true,
        razorpayKeyId: '',
        razorpayKeySecret: '',
        cashfreeEnabled: false,
        cashfreeAppId: '',
        cashfreeSecretKey: '',
        stripeEnabled: false,
        stripePublishableKey: '',
        stripeSecretKey: '',
      },
    },
    // Homepage Settings
    {
      group: 'homepage',
      key: 'homepage_settings',
      isPublic: true,
      value: {
        heroTitle: 'Empower Your Business With Webin10 Operating System',
        heroSubtitle: 'The all-in-one multi-tenant SaaS for Gyms, Coaching Centers, Salons & Academies.',
        ctaButtonText: 'Start Free Trial',
        ctaButtonUrl: '/register',
        contactEmail: 'contact@webin10.com',
        contactPhone: '+91 7070799200',
        seoMetaTitle: 'Webin10 - Modern SaaS Business Operating System',
        seoMetaDescription: 'Next-generation cloud management system for gyms, coaching institutes, salons and academies.',
      },
    },
    // Google reCAPTCHA
    {
      group: 'recaptcha',
      key: 'recaptcha_settings',
      isPublic: true,
      value: {
        enabled: false,
        version: 'v2',
        siteKey: '',
        secretKey: '',
      },
    },
    // Social Settings
    {
      group: 'social',
      key: 'social_settings',
      isPublic: true,
      value: {
        facebookUrl: 'https://facebook.com/webin10',
        twitterUrl: 'https://twitter.com/webin10',
        instagramUrl: 'https://instagram.com/webin10',
        linkedinUrl: 'https://linkedin.com/company/webin10',
        youtubeUrl: 'https://youtube.com/@webin10',
        whatsappNumber: '+917070799200',
      },
    },
    // Mail Settings (Google SMTP & Custom SMTP)
    {
      group: 'mail',
      key: 'mail_settings',
      isPublic: false,
      value: {
        provider: 'google', // 'google' | 'smtp' | 'ses' | 'resend'
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // TLS on 587, SSL on 465
        username: 'webin10.in@gmail.com',
        password: '', // Google App Password (16 characters)
        fromEmail: 'webin10.in@gmail.com',
        fromName: 'Webin10 Platform',
        replyTo: 'support@webin10.com',
      },
    },
    // Custom Domain
    {
      group: 'custom_domain',
      key: 'custom_domain_settings',
      isPublic: true,
      value: {
        enabled: true,
        cnameTarget: 'cname.webin10.com',
        serverIp: '76.76.21.21',
        instructions: 'Add a CNAME DNS record pointing your domain or subdomain to cname.webin10.com with TTL 300.',
      },
    },
    // Theme Color
    {
      group: 'theme',
      key: 'theme_settings',
      isPublic: true,
      value: {
        primaryColor: '#00D09C', // Emerald/Turquoise branding from user screenshot
        secondaryColor: '#0F172A',
        accentColor: '#F59E0B',
        darkModeDefault: false,
        logoUrl: '',
        faviconUrl: '',
      },
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
    console.log(`✓ System Setting seeded: [${setting.group}] -> ${setting.key}`);
  }

  // 6. Seed Email Templates
  const emailTemplates = [
    {
      name: 'Welcome & Account Verification',
      slug: 'welcome_email',
      category: 'ONBOARDING',
      subject: 'Welcome to {{app_name}} - Your Business Cloud is Ready!',
      variables: ['app_name', 'business_name', 'user_name', 'login_url', 'support_email'],
      bodyHtml: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h2 style="color: #00D09C; margin: 0;">{{app_name}}</h2>
    <p style="color: #64748b; font-size: 14px;">Business Operating System</p>
  </div>
  <p style="font-size: 16px; color: #1e293b;">Hello <strong>{{user_name}}</strong>,</p>
  <p style="font-size: 15px; color: #334155; line-height: 1.6;">
    Welcome to {{app_name}}! Your dedicated business workspace for <strong>{{business_name}}</strong> has been provisioned and is ready for use.
  </p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{login_url}}" style="background-color: #00D09C; color: #ffffff; padding: 12px 28px; font-size: 15px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block;">Access Your Business Portal</a>
  </div>
  <p style="font-size: 14px; color: #64748b; line-height: 1.5;">
    If you did not request this account, please immediately reach out to <a href="mailto:{{support_email}}">{{support_email}}</a>.
  </p>
  <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
  <p style="font-size: 12px; color: #94a3b8; text-align: center;">&copy; {{app_name}} Platform. All rights reserved.</p>
</div>
      `.trim(),
      bodyText: 'Welcome to {{app_name}}! Log in to {{login_url}} to get started.',
    },
    {
      name: 'Subscription Plan Expiry Notice',
      slug: 'plan_expiry_alert',
      category: 'SUBSCRIPTION',
      subject: 'Urgent: Your {{plan_name}} Plan on {{app_name}} expires in {{days_remaining}} days',
      variables: ['app_name', 'business_name', 'user_name', 'plan_name', 'expiry_date', 'days_remaining', 'renew_url'],
      bodyHtml: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fed7aa; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h2 style="color: #f97316; margin: 0;">Subscription Notice</h2>
    <p style="color: #64748b; font-size: 14px;">{{app_name}} Services</p>
  </div>
  <p style="font-size: 16px; color: #1e293b;">Dear <strong>{{user_name}}</strong>,</p>
  <p style="font-size: 15px; color: #334155; line-height: 1.6;">
    This is an automatic notification that your SaaS subscription plan (<strong>{{plan_name}}</strong>) for <strong>{{business_name}}</strong> will expire on <strong>{{expiry_date}}</strong> (in <strong>{{days_remaining}} days</strong>).
  </p>
  <p style="font-size: 15px; color: #334155; line-height: 1.6;">
    To prevent any disruption to your branch staff, automated WhatsApp messages, or customer check-ins, please renew your plan.
  </p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{renew_url}}" style="background-color: #f97316; color: #ffffff; padding: 12px 28px; font-size: 15px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block;">Renew Subscription Now</a>
  </div>
  <hr style="border: none; border-top: 1px solid #fed7aa; margin: 24px 0;" />
  <p style="font-size: 12px; color: #94a3b8; text-align: center;">&copy; {{app_name}} Platform.</p>
</div>
      `.trim(),
      bodyText: 'Your {{plan_name}} plan expires on {{expiry_date}}. Renew at {{renew_url}}.',
    },
    {
      name: 'Password Reset Request',
      slug: 'password_reset',
      category: 'AUTH',
      subject: 'Reset Your Password for {{app_name}}',
      variables: ['app_name', 'user_name', 'reset_link', 'expiry_minutes', 'support_email'],
      bodyHtml: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h2 style="color: #00D09C; margin: 0;">{{app_name}}</h2>
    <p style="color: #64748b; font-size: 14px;">Security Verification</p>
  </div>
  <p style="font-size: 16px; color: #1e293b;">Hello <strong>{{user_name}}</strong>,</p>
  <p style="font-size: 15px; color: #334155; line-height: 1.6;">
    We received a request to reset the password for your account. Click the button below to set a new password. This link will expire in <strong>{{expiry_minutes}} minutes</strong>.
  </p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{reset_link}}" style="background-color: #00D09C; color: #ffffff; padding: 12px 28px; font-size: 15px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block;">Reset My Password</a>
  </div>
  <p style="font-size: 13px; color: #64748b;">
    If you did not request a password reset, you can safely ignore this email.
  </p>
  <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
  <p style="font-size: 12px; color: #94a3b8; text-align: center;">&copy; {{app_name}} Platform.</p>
</div>
      `.trim(),
      bodyText: 'Reset your {{app_name}} password at {{reset_link}}.',
    },
    {
      name: 'Payment Receipt & Invoice',
      slug: 'payment_receipt',
      category: 'BILLING',
      subject: 'Payment Confirmation: Invoice #{{invoice_number}} - {{app_name}}',
      variables: ['app_name', 'user_name', 'business_name', 'invoice_number', 'amount_paid', 'payment_date', 'download_url'],
      bodyHtml: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h2 style="color: #00D09C; margin: 0;">Payment Confirmation</h2>
    <p style="color: #64748b; font-size: 14px;">{{app_name}} Invoicing</p>
  </div>
  <p style="font-size: 16px; color: #1e293b;">Hello <strong>{{user_name}}</strong>,</p>
  <p style="font-size: 15px; color: #334155; line-height: 1.6;">
    Thank you for your payment. We have successfully received <strong>{{amount_paid}}</strong> for invoice <strong>#{{invoice_number}}</strong> on <strong>{{payment_date}}</strong>.
  </p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{download_url}}" style="background-color: #00D09C; color: #ffffff; padding: 12px 28px; font-size: 15px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block;">Download Tax Invoice PDF</a>
  </div>
  <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
  <p style="font-size: 12px; color: #94a3b8; text-align: center;">&copy; {{app_name}} Invoicing Engine.</p>
</div>
      `.trim(),
      bodyText: 'Payment of {{amount_paid}} received for invoice #{{invoice_number}}. Download at {{download_url}}.',
    },
  ];

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { slug: template.slug },
      update: {},
      create: template,
    });
    console.log(`✓ Email Template seeded: ${template.name} [${template.slug}]`);
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
