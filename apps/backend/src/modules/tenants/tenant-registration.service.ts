import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export interface PendingRegistration {
  registrationToken: string;
  businessName: string;
  categorySlug: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  city?: string;
  password?: string;
  emailOtp: string;
  phoneOtp: string;
  createdAt: number;
  expiresAt: number; // 10 minutes expiry
}

@Injectable()
export class TenantRegistrationService {
  private readonly logger = new Logger(TenantRegistrationService.name);

  // In-memory pending registrations cache with 10-minute TTL
  private pendingRegistrations = new Map<string, PendingRegistration>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  /**
   * 1. Get available business vertical categories
   */
  async getCategories() {
    const categories = await this.prisma.businessCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
    });

    return categories;
  }

  /**
   * 2. Step 1: Initiate Self-Service Registration & Dispatch Dual OTPs
   */
  async sendRegistrationOtps(dto: {
    businessName: string;
    categorySlug: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    city?: string;
    password?: string;
  }) {
    const businessName = dto.businessName.trim();
    const ownerName = dto.ownerName.trim();
    const ownerEmail = dto.ownerEmail.trim().toLowerCase();
    const ownerPhone = dto.ownerPhone.trim().replace(/\s+/g, '');

    if (!businessName || !ownerName || !ownerEmail || !ownerPhone) {
      throw new BadRequestException('Business name, owner name, email, and phone are required.');
    }

    // A. Check if category exists
    const category = await this.prisma.businessCategory.findUnique({
      where: { slug: dto.categorySlug },
    });
    if (!category) {
      throw new NotFoundException(`Business category '${dto.categorySlug}' not found.`);
    }

    // B. Check if owner email or phone is already registered as an owner
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: ownerEmail }, { phone: ownerPhone }],
      },
    });

    if (existingUser) {
      if (existingUser.email === ownerEmail) {
        throw new ConflictException(`An account with email '${ownerEmail}' already exists. Please login.`);
      }
      if (existingUser.phone === ownerPhone) {
        throw new ConflictException(`An account with mobile number '${ownerPhone}' already exists. Please login.`);
      }
    }

    // C. Generate 6-digit OTPs
    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const phoneOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Registration Token (10 minute TTL)
    const registrationToken = randomUUID();
    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1000;

    const pendingRecord: PendingRegistration = {
      registrationToken,
      businessName,
      categorySlug: dto.categorySlug,
      ownerName,
      ownerEmail,
      ownerPhone,
      city: dto.city?.trim(),
      password: dto.password,
      emailOtp,
      phoneOtp,
      createdAt: now,
      expiresAt,
    };

    this.pendingRegistrations.set(registrationToken, pendingRecord);

    // Clean up expired registrations
    this.cleanExpiredRegistrations();

    // D. Dispatch Email OTP
    try {
      await this.mailService.sendMail({
        to: ownerEmail,
        subject: `🔐 Your Verification Code for ${businessName} Registration - Webin10`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #059669; margin: 0; font-size: 24px; font-weight: 800;">Webin10 Business OS</h1>
              <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Smart Multi-Tenant Cloud Operating System</p>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
              <h2 style="font-size: 18px; color: #0f172a; margin-top: 0; font-weight: 700;">Hello ${ownerName}! 👋</h2>
              <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                Thank you for choosing Webin10 to power <strong>"${businessName}"</strong>. Please verify your email address to complete your business registration.
              </p>

              <div style="margin: 24px 0; text-align: center; background: #ffffff; border: 2px dashed #059669; border-radius: 10px; padding: 18px;">
                <span style="font-size: 12px; color: #64748b; display: block; margin-bottom: 6px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Your Email Verification OTP</span>
                <span style="font-size: 32px; font-weight: 900; color: #065f46; letter-spacing: 6px;">${emailOtp}</span>
                <span style="font-size: 11px; color: #94a3b8; display: block; margin-top: 6px;">Valid for 10 minutes. Never share this code with anyone.</span>
              </div>
            </div>

            <p style="font-size: 12px; color: #94a3b8; text-align: center;">
              If you did not request this verification, you can safely ignore this email.
            </p>
          </div>
        `,
      });
      this.logger.log(`Email verification OTP sent to ${ownerEmail}`);
    } catch (err: any) {
      this.logger.warn(`Could not dispatch email OTP to ${ownerEmail}: ${err.message}`);
    }

    // E. Dispatch Phone / WhatsApp OTP
    try {
      await this.whatsAppService.sendTextMessage(
        ownerPhone,
        `🔐 *Webin10 Business Verification*\n\n` +
        `Hello *${ownerName}*! Your Phone Verification Code for registering *${businessName}* is:\n\n` +
        `👉 *${phoneOtp}*\n\n` +
        `Valid for 10 minutes. Do not share this OTP with anyone.\n` +
        `Welcome to Webin10 Smart Business OS! 🚀`,
      );
      this.logger.log(`WhatsApp verification OTP dispatched to ${ownerPhone}`);
    } catch (err: any) {
      this.logger.warn(`Could not dispatch WhatsApp OTP to ${ownerPhone}: ${err.message}`);
    }

    // Masked helpers for privacy
    const maskedEmail = ownerEmail.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}${'*'.repeat(b.length)}${c}`);
    const maskedPhone = ownerPhone.replace(/(\d{2})(\d+)(\d{2})/, (_, a, b, c) => `${a}${'*'.repeat(b.length)}${c}`);

    this.logger.log(`[REGISTRATION OTPs] Email OTP: ${emailOtp} | Phone OTP: ${phoneOtp} for ${ownerEmail}`);

    return {
      success: true,
      message: 'Verification codes have been dispatched to your Email and Phone / WhatsApp.',
      registrationToken,
      maskedEmail,
      maskedPhone,
      expiresAt,
    };
  }

  /**
   * 3. Resend OTP
   */
  async resendOtp(registrationToken: string, target: 'EMAIL' | 'PHONE' | 'BOTH' = 'BOTH') {
    const pending = this.pendingRegistrations.get(registrationToken);
    if (!pending || Date.now() > pending.expiresAt) {
      throw new BadRequestException('Registration session expired. Please start over.');
    }

    // Generate new codes
    if (target === 'EMAIL' || target === 'BOTH') {
      pending.emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
      try {
        await this.mailService.sendMail({
          to: pending.ownerEmail,
          subject: `🔐 Resent: Your Verification Code for ${pending.businessName}`,
          html: `<h3>Your new Email OTP is: <strong>${pending.emailOtp}</strong></h3>`,
        });
      } catch (err) {}
    }

    if (target === 'PHONE' || target === 'BOTH') {
      pending.phoneOtp = Math.floor(100000 + Math.random() * 900000).toString();
      try {
        await this.whatsAppService.sendTextMessage(
          pending.ownerPhone,
          `🔐 Your new Webin10 verification code is: *${pending.phoneOtp}*`,
        );
      } catch (err) {}
    }

    pending.expiresAt = Date.now() + 10 * 60 * 1000;
    this.pendingRegistrations.set(registrationToken, pending);

    return {
      success: true,
      message: 'New verification codes have been sent.',
    };
  }

  /**
   * 4. Step 2: Verify Dual OTPs & Provision Business Workspace
   */
  async verifyAndRegister(dto: {
    registrationToken: string;
    emailOtp: string;
    phoneOtp: string;
  }) {
    const { registrationToken, emailOtp, phoneOtp } = dto;
    const pending = this.pendingRegistrations.get(registrationToken);

    if (!pending) {
      throw new BadRequestException('Invalid or expired registration session. Please start over.');
    }

    if (Date.now() > pending.expiresAt) {
      this.pendingRegistrations.delete(registrationToken);
      throw new BadRequestException('Verification codes have expired. Please request new codes.');
    }

    // Validate Email OTP
    const validEmail = emailOtp.trim() === pending.emailOtp;
    if (!validEmail) {
      throw new BadRequestException('Incorrect Email Verification Code. Please check and try again.');
    }

    // Validate Phone OTP
    const validPhone = phoneOtp.trim() === pending.phoneOtp;
    if (!validPhone) {
      throw new BadRequestException('Incorrect Mobile/WhatsApp Verification Code. Please check and try again.');
    }

    // Category lookup
    const category = await this.prisma.businessCategory.findUnique({
      where: { slug: pending.categorySlug },
    });
    if (!category) {
      throw new NotFoundException(`Business category '${pending.categorySlug}' not found.`);
    }

    // Generate unique slug
    const baseSlug = pending.businessName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let suffix = 1;
    while (await this.prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    // Hash password if provided
    let passwordHash: string | undefined = undefined;
    if (pending.password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(pending.password, salt);
    }

    // Find a starter/trial plan
    const trialPlan =
      (await this.prisma.subscriptionPlan.findFirst({ where: { slug: 'starter', isActive: true } })) ||
      (await this.prisma.subscriptionPlan.findFirst({ where: { isActive: true } }));

    // Execute atomic transaction
    const result = await this.prisma.$transaction(async (tx: any) => {
      // 1. Create or update Owner User
      let owner = await tx.user.findFirst({
        where: {
          OR: [{ email: pending.ownerEmail }, { phone: pending.ownerPhone }],
        },
      });

      if (!owner) {
        owner = await tx.user.create({
          data: {
            email: pending.ownerEmail,
            phone: pending.ownerPhone,
            name: pending.ownerName,
            passwordHash,
            isActive: true,
          },
        });
      } else if (passwordHash && !owner.passwordHash) {
        owner = await tx.user.update({
          where: { id: owner.id },
          data: { passwordHash },
        });
      }

      // 2. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: pending.businessName,
          slug,
          status: 'ACTIVE',
          categoryId: category.id,
        },
      });

      // 3. Create Business Profile
      await tx.businessProfile.create({
        data: {
          tenantId: tenant.id,
          legalName: pending.businessName,
          phone: pending.ownerPhone,
          email: pending.ownerEmail,
          address: pending.city ? `${pending.city}, India` : 'Registered Workspace Address',
        },
      });

      // 4. Create Main Branch
      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: 'Main Branch',
          phone: pending.ownerPhone,
          isMain: true,
          isActive: true,
        },
      });

      // 5. Link Owner as TenantMember
      await tx.tenantMember.create({
        data: {
          tenantId: tenant.id,
          userId: owner.id,
          role: 'BUSINESS_OWNER',
          isActive: true,
        },
      });

      // 6. 14-Day Free Trial Subscription
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
      if (trialPlan) {
        await tx.tenantSubscription.create({
          data: {
            tenantId: tenant.id,
            planId: trialPlan.id,
            status: 'TRIAL',
            currentPeriodStart: now,
            currentPeriodEnd: trialEnd,
          },
        });
      }

      // 7. Auto-provision Category Default Modules
      const defaultCategoryModules = await tx.categoryModule.findMany({
        where: { categoryId: category.id, isDefault: true },
      });

      if (defaultCategoryModules.length > 0) {
        await tx.tenantModule.createMany({
          data: defaultCategoryModules.map((cm: any) => ({
            tenantId: tenant.id,
            moduleId: cm.moduleId,
            isEnabled: true,
          })),
          skipDuplicates: true,
        });
      }

      return { tenant, owner, branch };
    });

    // Remove pending record
    this.pendingRegistrations.delete(registrationToken);

    // Send final congratulatory welcome email & WhatsApp
    try {
      await this.mailService.sendMail({
        to: pending.ownerEmail,
        subject: `🎉 Congratulations! ${pending.businessName} is Live on Webin10 OS`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #059669; margin: 0; font-size: 24px; font-weight: 800;">🎉 Workspace Activated!</h1>
              <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Webin10 Business Operating System</p>
            </div>
            <p>Dear <strong>${pending.ownerName}</strong>,</p>
            <p>Both your Email and Phone have been verified. Your 14-day full-access trial for <strong>"${pending.businessName}"</strong> is now live!</p>
            <p><strong>Workspace URL:</strong> ${result.tenant.slug}.webin10.com</p>
          </div>
        `,
      });
    } catch (e) {}

    return {
      success: true,
      message: 'Business workspace successfully created and verified!',
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
      user: {
        id: result.owner.id,
        name: result.owner.name,
        email: result.owner.email,
        phone: result.owner.phone,
      },
    };
  }

  /**
   * 5. Business User Login (Email or Phone + Password)
   */
  async loginBusinessUser(dto: { identifier: string; password?: string }) {
    const identifier = dto.identifier.trim().toLowerCase();
    const cleanPhone = dto.identifier.trim().replace(/\s+/g, '');

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: cleanPhone },
          { phone: `+91${cleanPhone}` },
        ],
      },
      include: {
        memberships: {
          include: {
            tenant: {
              include: {
                subscriptions: {
                  include: { plan: true },
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
          where: { isActive: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('No business account found with this email or mobile number.');
    }

    if (!user.isActive) {
      throw new BadRequestException('Your account has been deactivated. Please contact support.');
    }

    // If password provided and user has passwordHash, check with bcrypt
    if (user.passwordHash && dto.password) {
      const isValid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isValid) {
        throw new BadRequestException('Incorrect password. Please try again.');
      }
    }

    const primaryMembership = user.memberships[0];
    const tenant = primaryMembership?.tenant;

    return {
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: primaryMembership?.role || 'BUSINESS_OWNER',
      },
      tenant: tenant
        ? {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            status: tenant.status,
            plan: tenant.subscriptions[0]?.plan?.name || '14-Day Free Trial',
          }
        : null,
    };
  }

  private cleanExpiredRegistrations() {
    const now = Date.now();
    for (const [token, rec] of this.pendingRegistrations.entries()) {
      if (now > rec.expiresAt) {
        this.pendingRegistrations.delete(token);
      }
    }
  }
}
