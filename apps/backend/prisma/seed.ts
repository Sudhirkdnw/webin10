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
    // Cloudinary Media Storage Settings
    {
      group: 'cloudinary',
      key: 'cloudinary_settings',
      isPublic: false,
      value: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
        folderPrefix: 'webin10',
        secure: true,
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

  // 10. Seed Default System WhatsApp Templates
  const defaultWhatsAppTemplates = [
    {
      code: 'member_welcome',
      name: 'New Member Welcome Greeting',
      category: 'UTILITY' as any,
      status: 'APPROVED' as any,
      isSystemDefault: true,
      bodyText: 'Hello {{1}}, welcome to {{2}}! 🏋️ Your registration is complete. Your Member ID is #{{3}}. View your schedule and access pass: {{4}}',
      sampleVariables: ['Rahul Sharma', 'FitZone Fitness Club', '1048', 'https://webin10.com/pass/1048'],
      buttons: [{ type: 'URL', text: 'View Digital Pass', url: 'https://webin10.com/pass/1048' }],
    },
    {
      code: 'fee_reminder_due',
      name: 'Membership Renewal / Fee Reminder',
      category: 'UTILITY' as any,
      status: 'APPROVED' as any,
      isSystemDefault: true,
      bodyText: 'Hi {{1}}, friendly reminder that your membership at {{2}} is due on {{3}} (Amount: {{4}}). Please click below to renew online and avoid late fee.',
      sampleVariables: ['Rahul Sharma', 'FitZone Fitness Club', '28 Nov 2026', '₹1,500'],
      buttons: [{ type: 'URL', text: 'Pay / Renew Now', url: 'https://webin10.com/pay' }],
    },
    {
      code: 'payment_receipt',
      name: 'Fee Payment Confirmation & Invoice',
      category: 'UTILITY' as any,
      status: 'APPROVED' as any,
      isSystemDefault: true,
      bodyText: 'Dear {{1}}, thank you! We have received your payment of {{2}} for {{3}}. Your receipt #{{4}} has been generated. Thank you for choosing us!',
      sampleVariables: ['Rahul Sharma', '₹1,500', 'Gold Quarterly Plan', 'INV-2026-9041'],
      buttons: [{ type: 'URL', text: 'Download Tax Invoice', url: 'https://webin10.com/invoice' }],
    },
    {
      code: 'class_absent_alert',
      name: 'Class Absence Notice',
      category: 'UTILITY' as any,
      status: 'APPROVED' as any,
      isSystemDefault: true,
      bodyText: 'Dear Parent/Guardian, {{1}} was marked absent today in {{2}} batch scheduled at {{3}}. For queries, reach us at {{4}}.',
      sampleVariables: ['Aman Kumar', 'Physics 12th Board', '10:00 AM', '+91 7070799200'],
      buttons: [{ type: 'PHONE_NUMBER', text: 'Call Institute', phoneNumber: '+917070799200' }],
    },
    {
      code: 'festival_offer_blast',
      name: 'Promotional Festival Offer & Discount',
      category: 'MARKETING' as any,
      status: 'APPROVED' as any,
      isSystemDefault: true,
      bodyText: 'Special Festival Offer from {{1}}! 🎉 Enjoy an exclusive {{2}}% OFF on all membership renewals and course batches before {{3}}. Use Code: {{4}}',
      sampleVariables: ['FitZone Fitness Club', '25', '30 Nov 2026', 'FEST25'],
      buttons: [{ type: 'URL', text: 'Claim Special Offer', url: 'https://webin10.com/offers' }],
    },
    // Platform-Level Templates (Super Admin to Tenants)
    {
      code: 'platform_tenant_welcome',
      name: 'Super Admin: Tenant Workspace Activation Greeting',
      category: 'UTILITY' as any,
      status: 'APPROVED' as any,
      isSystemDefault: true,
      bodyText: 'Welcome {{1}} to Webin10 OS! 🚀 Your business workspace for {{2}} has been activated. Access your portal at {{3}}',
      sampleVariables: ['Aman Admin', 'FitZone Club', 'https://fitzone.webin10.com'],
      buttons: [{ type: 'URL', text: 'Open Admin Portal', url: 'http://localhost:3002' }],
    },
    {
      code: 'platform_plan_expiry_7d',
      name: 'Super Admin: 7-Day SaaS Subscription Expiry Alert',
      category: 'UTILITY' as any,
      status: 'APPROVED' as any,
      isSystemDefault: true,
      bodyText: 'Hi {{1}}, reminder that your Webin10 {{2}} subscription for {{3}} is expiring in 7 days (on {{4}}). Please click below to renew: {{5}}',
      sampleVariables: ['Aman Admin', 'Growth Plan', 'FitZone Club', '30 Nov 2026', 'https://webin10.com/billing'],
      buttons: [{ type: 'URL', text: 'Renew Platform Plan', url: 'https://webin10.com/billing' }],
    },
    {
      code: 'platform_subscription_invoice',
      name: 'Super Admin: Platform Subscription Tax Invoice',
      category: 'UTILITY' as any,
      status: 'APPROVED' as any,
      isSystemDefault: true,
      bodyText: 'Dear {{1}}, thank you! We have received payment of {{2}} for your Webin10 {{3}} subscription. Download tax receipt: {{4}}',
      sampleVariables: ['Aman Admin', '₹999.00', 'Growth Plan', 'https://webin10.com/receipt/inv-01'],
      buttons: [{ type: 'URL', text: 'Download SaaS Invoice', url: 'https://webin10.com/invoice' }],
    },
  ];

  for (const t of defaultWhatsAppTemplates) {
    await prisma.whatsAppTemplate.upsert({
      where: { code: t.code },
      update: {},
      create: t,
    });
    console.log(`✓ WhatsApp Template seeded: ${t.name} [${t.code}]`);
  }

  // 10.1 Seed Platform WhatsApp Automation Rules (Managed by Super Admin)
  const platformAutomations = [
    { eventType: 'PLATFORM_TENANT_WELCOME' as any, name: 'Business Owner Welcome on Workspace Registration', isEnabled: true, templateCode: 'platform_tenant_welcome', triggerTiming: 0 },
    { eventType: 'PLATFORM_PLAN_EXPIRY_7D' as any, name: '7-Day Prior SaaS Subscription Renewal Reminder', isEnabled: true, templateCode: 'platform_plan_expiry_7d', triggerTiming: -7 },
    { eventType: 'PLATFORM_PLAN_EXPIRY_3D' as any, name: 'Urgent 3-Day Prior SaaS Expiry Notice', isEnabled: true, templateCode: 'platform_plan_expiry_7d', triggerTiming: -3 },
    { eventType: 'PLATFORM_SUBSCRIPTION_INVOICE' as any, name: 'Instant SaaS Plan Subscription Payment Receipt', isEnabled: true, templateCode: 'platform_subscription_invoice', triggerTiming: 0 },
  ];

  for (const pa of platformAutomations) {
    const existing = await prisma.whatsAppAutomationRule.findFirst({
      where: { tenantId: null, eventType: pa.eventType },
    });
    if (!existing) {
      await prisma.whatsAppAutomationRule.create({
        data: {
          ...pa,
          tenantId: null,
        },
      });
      console.log(`✓ Platform WhatsApp Automation rule seeded: ${pa.name}`);
    }
  }

  // 11. Seed Demo Tenant (Gym & Fitness) with Customers for testing
  const gymCat = await prisma.businessCategory.findUnique({ where: { slug: 'gym' } });
  if (gymCat) {
    const demoTenant = await prisma.tenant.upsert({
      where: { slug: 'fitzone-gym' },
      update: {},
      create: {
        name: 'FitZone Club & Studio',
        slug: 'fitzone-gym',
        categoryId: gymCat.id,
        status: 'ACTIVE',
        profile: {
          create: {
            legalName: 'FitZone Fitness Private Limited',
            phone: '+91 7070799200',
            email: 'fitzone@webin10.com',
            address: 'Main Market, West Champaran, Bihar, 845455',
          },
        },
      },
    });

    // Seed default WhatsApp Account for Demo Tenant
    await prisma.whatsAppAccount.upsert({
      where: { tenantId: demoTenant.id },
      update: {},
      create: {
        tenantId: demoTenant.id,
        mode: 'SHARED_PLATFORM',
        status: 'CONNECTED',
        displayPhoneNumber: '+91 7070799200',
        qualityRating: 'GREEN',
        creditsBalance: 500.0,
      },
    });

    // Seed Demo Customers
    const demoCustomers = [
      { firstName: 'Aman', lastName: 'Kumar', phone: '+919876543210', email: 'aman@gmail.com', status: 'ACTIVE' as any, membershipPlan: 'Annual Gold Plan', pendingAmount: 0.0, expiryDate: new Date(Date.now() + 90 * 86400000) },
      { firstName: 'Rahul', lastName: 'Verma', phone: '+919876543211', email: 'rahul@gmail.com', status: 'ACTIVE' as any, membershipPlan: 'Monthly Strength', pendingAmount: 1500.0, expiryDate: new Date(Date.now() + 2 * 86400000) },
      { firstName: 'Pooja', lastName: 'Singh', phone: '+919876543212', email: 'pooja@gmail.com', status: 'EXPIRED' as any, membershipPlan: 'Quarterly Cardio', pendingAmount: 0.0, expiryDate: new Date(Date.now() - 15 * 86400000) },
      { firstName: 'Vikram', lastName: 'Aditya', phone: '+919876543213', email: 'vikram@gmail.com', status: 'LEAD' as any, membershipPlan: 'Trial Inquiry', pendingAmount: 0.0, expiryDate: null },
      { firstName: 'Sneha', lastName: 'Gupta', phone: '+919876543214', email: 'sneha@gmail.com', status: 'ACTIVE' as any, membershipPlan: '6-Month Crossfit', pendingAmount: 2000.0, expiryDate: new Date(Date.now() + 1 * 86400000) },
    ];

    for (const c of demoCustomers) {
      const existing = await prisma.customer.findFirst({
        where: { tenantId: demoTenant.id, phone: c.phone },
      });
      if (!existing) {
        await prisma.customer.create({
          data: {
            ...c,
            tenantId: demoTenant.id,
          },
        });
      }
    }

    // Seed Default Automation Rules
    const autoRules = [
      { eventType: 'MEMBER_WELCOME' as any, name: 'Welcome Message on Registration', isEnabled: true, templateCode: 'member_welcome', triggerTiming: 0 },
      { eventType: 'FEE_REMINDER_DUE' as any, name: '3-Day Prior Fee Renewal Reminder', isEnabled: true, templateCode: 'fee_reminder_due', triggerTiming: -3 },
      { eventType: 'PAYMENT_RECEIPT' as any, name: 'Instant Payment Confirmation Invoice', isEnabled: true, templateCode: 'payment_receipt', triggerTiming: 0 },
      { eventType: 'CLASS_ABSENT' as any, name: 'Absent Alert Notification', isEnabled: true, templateCode: 'class_absent_alert', triggerTiming: 0 },
    ];

    for (const r of autoRules) {
      const existing = await prisma.whatsAppAutomationRule.findFirst({
        where: { tenantId: demoTenant.id, eventType: r.eventType },
      });
      if (!existing) {
        await prisma.whatsAppAutomationRule.create({
          data: {
            ...r,
            tenantId: demoTenant.id,
          },
        });
      }
    }

    console.log(`✓ Demo Tenant FitZone seeded with WhatsApp Account, Customers and Automation Rules`);
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
