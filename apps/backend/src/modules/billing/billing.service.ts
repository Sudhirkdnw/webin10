import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { MailService } from '@/modules/mail/mail.service';
import { WhatsAppService } from '@/modules/whatsapp/whatsapp.service';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { ListInvoicesDto } from './dto/list-invoices.dto';
import * as crypto from 'crypto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
    private readonly whatsappService: WhatsAppService,
  ) {}

  /**
   * 1. Central SaaS Revenue & MRR Metrics
   */
  async getRevenueMetrics() {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Active & Trial Subscriptions
    const [subscriptions, totalTenants, paidInvoices, pendingInvoices] = await Promise.all([
      this.prisma.tenantSubscription.findMany({
        where: {
          status: { in: ['ACTIVE', 'TRIAL'] },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          plan: true,
          tenant: { select: { id: true, name: true, status: true } },
        },
      }),
      this.prisma.tenant.count(),
      this.prisma.platformInvoice.findMany({
        where: { status: 'PAID' },
        select: { amountTotal: true, createdAt: true },
      }),
      this.prisma.platformInvoice.findMany({
        where: { status: 'PENDING' },
        select: { amountTotal: true },
      }),
    ]);

    // MRR Calculation (monthly plan price in rupees)
    let mrrInr = 0;
    let activeSubscribersCount = 0;
    let expiringIn7DaysCount = 0;

    // Deduplicate: Track latest current subscription per unique tenant
    const seenTenants = new Set<string>();

    for (const sub of subscriptions) {
      if (!sub.tenantId || seenTenants.has(sub.tenantId)) {
        continue;
      }
      seenTenants.add(sub.tenantId);

      if (sub.tenant?.status === 'ACTIVE') {
        activeSubscribersCount++;
        // Database stores priceMonthly in paise (e.g. 49900 paise = 499 INR, 99900 = 999 INR)
        const priceInPaise = sub.plan?.priceMonthly || 0;
        const priceInRupees = priceInPaise >= 1000 ? Math.round(priceInPaise / 100) : priceInPaise;
        mrrInr += priceInRupees;
      }

      if (sub.currentPeriodEnd >= now && sub.currentPeriodEnd <= in7Days) {
        expiringIn7DaysCount++;
      }
    }

    const arrInr = mrrInr * 12;

    // Total Revenue Collected
    const totalRevenueCollected = paidInvoices.reduce((acc, inv) => acc + Number(inv.amountTotal), 0);
    const pendingRevenue = pendingInvoices.reduce((acc, inv) => acc + Number(inv.amountTotal), 0);
    const arpuInr = activeSubscribersCount > 0 ? Math.round(mrrInr / activeSubscribersCount) : 0;

    // Monthly Trend (Last 6 Months)
    const monthlyTrend: { month: string; revenue: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthLabel = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });

      const monthInvoices = paidInvoices.filter((inv) => inv.createdAt >= d && inv.createdAt < nextD);
      const revenue = monthInvoices.reduce((acc, inv) => acc + Number(inv.amountTotal), 0);

      monthlyTrend.push({
        month: monthLabel,
        revenue: Math.round(revenue),
        count: monthInvoices.length,
      });
    }

    return {
      mrr: Math.round(mrrInr),
      arr: Math.round(arrInr),
      totalRevenueCollected: Math.round(totalRevenueCollected),
      pendingRevenue: Math.round(pendingRevenue),
      activeSubscribersCount,
      totalTenants,
      expiringIn7DaysCount,
      arpu: arpuInr,
      monthlyTrend,
    };
  }

  /**
   * 2. Expiring Subscriptions (Next 7 Days & Recently Expired)
   */
  async getExpiringSubscriptions(daysAhead = 7) {
    const now = new Date();
    const futureLimit = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    const pastLimit = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // include last 14 days expired

    const subscriptions = await this.prisma.tenantSubscription.findMany({
      where: {
        status: { in: ['ACTIVE', 'TRIAL', 'EXPIRED'] },
        currentPeriodEnd: {
          gte: pastLimit,
          lte: futureLimit,
        },
      },
      include: {
        plan: true,
        tenant: {
          include: {
            profile: true,
            members: {
              where: { role: 'BUSINESS_OWNER' },
              include: { user: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { currentPeriodEnd: 'asc' },
    });

    return subscriptions.map((sub) => {
      const msDiff = sub.currentPeriodEnd.getTime() - now.getTime();
      const daysRemaining = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
      const isExpired = daysRemaining <= 0;
      const owner = sub.tenant.members[0]?.user;
      const price = sub.plan ? (sub.plan.priceMonthly > 50000 ? sub.plan.priceMonthly / 100 : sub.plan.priceMonthly) : 0;

      return {
        subscriptionId: sub.id,
        tenantId: sub.tenant.id,
        tenantName: sub.tenant.name,
        tenantSlug: sub.tenant.slug,
        ownerName: owner?.name || sub.tenant.profile?.legalName || 'Business Owner',
        ownerEmail: owner?.email || sub.tenant.profile?.email || 'N/A',
        ownerPhone: owner?.phone || sub.tenant.profile?.phone || 'N/A',
        planName: sub.plan?.name || 'Standard Plan',
        priceMonthly: price,
        status: sub.status,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        daysRemaining,
        isExpired,
      };
    });
  }

  /**
   * 3. List Invoices with Search & Filters
   */
  async listInvoices(dto: ListInvoicesDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (dto.tenantId) where.tenantId = dto.tenantId;
    if (dto.status) where.status = dto.status;
    if (dto.search) {
      where.OR = [
        { invoiceNumber: { contains: dto.search, mode: 'insensitive' } },
        { customerName: { contains: dto.search, mode: 'insensitive' } },
        { customerEmail: { contains: dto.search, mode: 'insensitive' } },
        { customerPhone: { contains: dto.search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.platformInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.platformInvoice.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 4. Get Invoice by ID (with GST Tax Details)
   */
  async getInvoiceById(id: string) {
    const invoice = await this.prisma.platformInvoice.findUnique({
      where: { id },
      include: {
        tenant: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID '${id}' not found`);
    }

    // Company (Seller) Details
    const sellerInfo = {
      legalName: 'Webin10 Technologies India Pvt Ltd',
      tradeName: 'Webin10 SaaS Platform',
      gstin: '07AAAAW1010A1Z5',
      pan: 'AAAAW1010A',
      sacCode: '998313', // Information Technology & SaaS Software
      address: 'Plot 42, Cyber City Tech Hub, Gurugram, Haryana - 122002',
      email: 'billing@webin10.com',
      supportPhone: '+91 70796 83967',
      website: 'https://webin10.com',
    };

    return {
      invoice,
      seller: sellerInfo,
    };
  }

  /**
   * 5. Automated GST Tax Invoice Generator
   */
  async generateInvoice(dto: GenerateInvoiceDto, adminId?: string, ip?: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
      include: {
        profile: true,
        members: { where: { role: 'BUSINESS_OWNER' }, include: { user: true }, take: 1 },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${dto.tenantId}' not found`);
    }

    // Generate Sequential Invoice Number (e.g. INV-2026-0001)
    const year = new Date().getFullYear();
    const count = await this.prisma.platformInvoice.count();
    const invoiceNumber = `INV-${year}-${(count + 1).toString().padStart(4, '0')}`;

    // GST Tax Calculations
    const subtotal = Number(dto.amountSubtotal);
    const taxRate = Number(dto.taxPercentage ?? 18);
    const taxAmount = (subtotal * taxRate) / 100;

    // By default for intra-state in India: CGST (9%) + SGST (9%)
    const cgst = Number((taxAmount / 2).toFixed(2));
    const sgst = Number((taxAmount / 2).toFixed(2));
    const igst = 0;
    const amountTotal = Number((subtotal + taxAmount).toFixed(2));

    const owner = tenant.members[0]?.user;
    const customerName = owner?.name || tenant.profile?.legalName || tenant.name;
    const customerEmail = owner?.email || tenant.profile?.email || `accounts@${tenant.slug}.webin10.in`;
    const customerPhone = owner?.phone || tenant.profile?.phone || null;
    const customerGstin = dto.customerGstin || tenant.profile?.taxId || null;
    const customerAddress = dto.customerAddress || tenant.profile?.address || 'India';

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (dto.billingPeriodDays || 30) * 24 * 60 * 60 * 1000);

    const invoice = await this.prisma.platformInvoice.create({
      data: {
        invoiceNumber,
        tenantId: dto.tenantId,
        subscriptionId: dto.subscriptionId || null,
        planName: dto.planName,
        amountSubtotal: subtotal,
        taxPercentage: taxRate,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        taxAmount,
        amountTotal,
        hsnCode: '998313',
        status: 'PAID',
        billingPeriodStart: startDate,
        billingPeriodEnd: endDate,
        paidAt: new Date(),
        paymentMethod: dto.paymentMethod || 'RAZORPAY',
        paymentReference: dto.paymentReference || `PAY_${Date.now()}`,
        customerName,
        customerEmail,
        customerPhone,
        customerGstin,
        customerAddress,
        notes: dto.notes,
      },
    });

    if (adminId) {
      await this.auditService.log({
        actorId: adminId,
        actorType: 'PLATFORM_ADMIN',
        tenantId: dto.tenantId,
        action: 'billing.invoice_generated',
        entity: 'platform_invoices',
        entityId: invoice.id,
        details: {
          invoiceNumber,
          amountTotal,
          planName: dto.planName,
          paymentMethod: dto.paymentMethod,
        },
        ipAddress: ip,
      });
    }

    return invoice;
  }

  /**
   * 6. Renew Tenant Subscription & Auto-Generate Invoice
   */
  async renewSubscription(subscriptionId: string, adminId: string, ip?: string, paymentMethod: string = 'RAZORPAY', paymentReference?: string) {
    const subscription = await this.prisma.tenantSubscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true, tenant: true },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID '${subscriptionId}' not found`);
    }

    const now = new Date();
    // Start from currentPeriodEnd if still in future, or from today if already expired
    const currentEnd = new Date(subscription.currentPeriodEnd);
    const baseStart = currentEnd > now ? currentEnd : now;
    const newEnd = new Date(baseStart.getTime() + 30 * 24 * 60 * 60 * 1000);

    const updatedSub = await this.prisma.tenantSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: baseStart,
        currentPeriodEnd: newEnd,
      },
    });

    // Auto-Generate GST Tax Invoice
    const price = subscription.plan ? (subscription.plan.priceMonthly > 50000 ? subscription.plan.priceMonthly / 100 : subscription.plan.priceMonthly) : 2999;
    const invoice = await this.generateInvoice(
      {
        tenantId: subscription.tenantId,
        subscriptionId: subscription.id,
        planName: subscription.plan?.name || 'SaaS Renewal',
        amountSubtotal: price,
        taxPercentage: 18,
        paymentMethod: paymentMethod,
        paymentReference: paymentReference || `RNW_${Date.now()}`,
        billingPeriodDays: 30,
        notes: `Subscription renewed via ${paymentMethod}. New expiry: ${newEnd.toLocaleDateString()}`,
      },
      adminId,
      ip,
    );

    await this.auditService.log({
      actorId: adminId,
      actorType: 'PLATFORM_ADMIN',
      tenantId: subscription.tenantId,
      action: 'subscription.renewed',
      entity: 'tenant_subscriptions',
      entityId: subscription.id,
      details: {
        newPeriodEnd: newEnd,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amountTotal,
        paymentMethod,
      },
      ipAddress: ip,
    });

    return {
      success: true,
      subscription: updatedSub,
      invoice,
    };
  }

  /**
   * 7. Payment Gateway Webhook Handler (Razorpay, Cashfree & Stripe)
   */
  async handlePaymentWebhook(provider: string, payload: any, signature?: string) {
    const prov = provider.toLowerCase();
    this.logger.log(`Received ${provider} payment webhook: ${payload?.type || payload?.event || 'generic'}`);

    // A. RAZORPAY WEBHOOK HANDLER
    if (prov === 'razorpay') {
      const event = payload?.event;
      this.logger.log(`Processing Razorpay webhook event: ${event}`);

      // 1. Fetch Razorpay Integration Webhook Secret
      const rzpIntegration = await this.prisma.platformIntegration.findUnique({
        where: { provider: 'RAZORPAY' as any },
      });
      const webhookSecret =
        (rzpIntegration?.credentials as any)?.webhookSecret ||
        process.env.RAZORPAY_WEBHOOK_SECRET;

      // 2. Cryptographic Signature Verification (HMAC-SHA256)
      if (signature && webhookSecret) {
        try {
          const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload);
          const expectedSig = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('hex');

          const isMatch =
            signature === expectedSig ||
            (signature.length === expectedSig.length &&
              crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig)));

          if (!isMatch) {
            this.logger.warn(`Razorpay Webhook Signature Mismatch! Expected: ${expectedSig.slice(0, 8)}... Received: ${signature.slice(0, 8)}...`);
            // Only reject if not in test simulator mode
            if (!rzpIntegration?.isTestMode) {
              return { received: false, error: 'Invalid Razorpay webhook signature' };
            }
          } else {
            this.logger.log(`Razorpay Webhook Signature Verified Successfully via HMAC-SHA256.`);
          }
        } catch (sigErr: any) {
          this.logger.error(`Error verifying Razorpay signature: ${sigErr.message}`);
        }
      }

      // 3. Process Events
      if (event === 'payment.captured' || event === 'order.paid') {
        const payment = payload?.payload?.payment?.entity || payload?.payload?.order?.entity;
        const tenantId = payment?.notes?.tenant_id || payment?.notes?.tenantId;
        const amountPaise = payment?.amount || 0;
        const amountRupees = amountPaise / 100;
        const paymentId = payment?.id || `PAY_${Date.now()}`;

        if (tenantId) {
          await this.processSuccessfulPayment(tenantId, amountRupees, 'RAZORPAY', paymentId);
          this.logger.log(`Razorpay Payment Captured for tenant ${tenantId}: ₹${amountRupees} (ID: ${paymentId})`);
        }
      } else if (event === 'payment.failed') {
        const payment = payload?.payload?.payment?.entity;
        const tenantId = payment?.notes?.tenant_id || payment?.notes?.tenantId;
        this.logger.warn(
          `Razorpay Payment Failed for tenant ${tenantId || 'Unknown'}: Reason: ${
            payment?.error_description || 'Unknown error'
          } (ID: ${payment?.id})`,
        );
      }
    }

    // B. CASHFREE PAYMENTS WEBHOOK HANDLER
    else if (prov === 'cashfree') {
      const type = payload?.type;
      const event = payload?.event;
      // Cashfree PG v3 & legacy webhook events
      const isSuccess =
        type === 'PAYMENT_SUCCESS_WEBHOOK' ||
        type === 'ORDER_PAID_SUCCESS' ||
        event === 'order_paid' ||
        payload?.data?.payment?.payment_status === 'SUCCESS' ||
        payload?.txStatus === 'SUCCESS';

      if (isSuccess) {
        const order = payload?.data?.order;
        const payment = payload?.data?.payment;
        const tags = order?.order_tags || {};
        
        const tenantId =
          tags.tenant_id ||
          tags.tenantId ||
          payload?.data?.customer_details?.customer_id ||
          payload?.orderTags?.tenant_id;

        const amount = Number(
          payment?.payment_amount ||
          order?.order_amount ||
          payload?.orderAmount ||
          payload?.data?.order?.order_amount ||
          0
        );

        const paymentId = String(
          payment?.cf_payment_id ||
          payload?.referenceId ||
          order?.order_id ||
          `CF_PAY_${Date.now()}`
        );

        if (tenantId) {
          await this.processSuccessfulPayment(tenantId, amount, 'CASHFREE', paymentId);
        }
      }
    }

    // C. STRIPE WEBHOOK HANDLER
    else if (prov === 'stripe') {
      const eventType = payload?.type;
      if (eventType === 'checkout.session.completed' || eventType === 'invoice.payment_succeeded') {
        const session = payload?.data?.object;
        const tenantId = session?.client_reference_id || session?.metadata?.tenant_id;
        const amount = (session?.amount_total || session?.amount_paid || 0) / 100;
        const paymentId = session?.payment_intent || session?.id || `STRIPE_${Date.now()}`;

        if (tenantId) {
          await this.processSuccessfulPayment(tenantId, amount, 'STRIPE', paymentId);
        }
      }
    }

    return { received: true, provider, timestamp: new Date().toISOString() };
  }

  /**
   * Helper: Process successful payment, renew active subscription or issue invoice
   */
  private async processSuccessfulPayment(tenantId: string, amount: number, paymentMethod: string, paymentReference: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { plan: true },
        },
      },
    });

    if (!tenant) return;

    const sub = tenant.subscriptions[0];
    if (sub) {
      await this.renewSubscription(sub.id, 'WEBHOOK_AUTOMATION', undefined, paymentMethod, paymentReference);
    } else {
      await this.generateInvoice({
        tenantId: tenant.id,
        planName: `${paymentMethod} Online Subscription`,
        amountSubtotal: amount > 0 ? Number((amount / 1.18).toFixed(2)) : 1999.00,
        taxPercentage: 18,
        paymentMethod: paymentMethod,
        paymentReference: paymentReference,
      });
    }
  }

  /**
   * Automated Plan Expiry Alert Dispatcher (WhatsApp + Email)
   */
  async triggerExpiryAlerts(
    dto: { daysAhead?: number; sendEmail?: boolean; sendWhatsapp?: boolean; specificSubscriptionId?: string },
    adminId?: string,
    ip?: string,
  ) {
    const genSetting = await this.prisma.systemSetting.findFirst({
      where: { key: 'general_settings' },
    });
    const defaultDays = (genSetting?.value as any)?.planExpireNotificationDays || 5;
    const appName = (genSetting?.value as any)?.appName || 'Webin10';
    const daysAhead = dto.daysAhead !== undefined ? dto.daysAhead : defaultDays;

    const sendEmail = dto.sendEmail ?? true;
    const sendWhatsapp = dto.sendWhatsapp ?? true;

    const expiring = await this.getExpiringSubscriptions(daysAhead);
    const targets = dto.specificSubscriptionId
      ? expiring.filter((e) => e.subscriptionId === dto.specificSubscriptionId)
      : expiring;

    const results: any[] = [];
    let emailSentCount = 0;
    let whatsappSentCount = 0;

    for (const item of targets) {
      const tenantName = item.tenantName || 'Valued Business';
      const ownerName = item.ownerName || tenantName;
      const recipientEmail = item.ownerEmail && item.ownerEmail !== 'N/A' ? item.ownerEmail : null;
      const recipientPhone = item.ownerPhone && item.ownerPhone !== 'N/A' ? item.ownerPhone : null;
      const planName = item.planName || 'SaaS Subscription';
      const daysLeft = item.daysRemaining;
      const formattedDate = new Date(item.currentPeriodEnd).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      let emailStatus: 'SENT' | 'FAILED' | 'SKIPPED' = 'SKIPPED';
      let whatsappStatus: 'SENT' | 'FAILED' | 'SKIPPED' = 'SKIPPED';
      let emailError = '';
      let whatsappError = '';

      // Send Email
      if (sendEmail && recipientEmail) {
        try {
          const htmlContent = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <div style="margin-bottom: 20px;">
                <h2 style="color: #0f172a; margin: 0; font-size: 20px;">⚠️ Subscription Expiry Alert</h2>
                <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">${appName} Cloud Business OS</p>
              </div>
              <p style="font-size: 14px; color: #334155; line-height: 1.6;">Dear <strong>${ownerName}</strong>,</p>
              <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                Your <strong>${planName}</strong> subscription for <strong>${tenantName}</strong> is scheduled to expire ${daysLeft <= 0 ? '<span style="color: #e11d48; font-weight: bold;">today</span>' : `in <strong>${daysLeft} days</strong> (on <strong>${formattedDate}</strong>)`}.
              </p>
              <div style="background: #f8fafc; border-left: 4px solid #00D09C; padding: 14px 18px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Workspace:</strong> ${tenantName}</p>
                <p style="margin: 6px 0 0 0; font-size: 13px; color: #334155;"><strong>Plan:</strong> ${planName}</p>
                <p style="margin: 6px 0 0 0; font-size: 13px; color: #334155;"><strong>Renewal Valid Until:</strong> ${formattedDate}</p>
                <p style="margin: 6px 0 0 0; font-size: 13px; color: #334155;"><strong>Renewal Amount:</strong> ₹${item.priceMonthly || 0}</p>
              </div>
              <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                To ensure uninterrupted service for your orders, team operations, customer communications, and live data, please log in and renew your plan promptly.
              </p>
              <div style="margin: 28px 0;">
                <a href="https://${appName.toLowerCase().replace(/\s+/g, '')}.in/billing" style="display: inline-block; background: #00D09C; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 14px; padding: 12px 28px; border-radius: 8px;">
                  Renew Subscription Now
                </a>
              </div>
              <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                Warm regards,<br/>The ${appName} Platform Team
              </p>
            </div>
          `;
          await this.mailService.sendMail(
            {
              to: recipientEmail,
              subject: `Action Required: Your ${appName} subscription for ${tenantName} expires in ${daysLeft} days`,
              html: htmlContent,
              recipientName: ownerName,
            },
            { tenantId: item.tenantId },
          );
          emailStatus = 'SENT';
          emailSentCount++;
        } catch (err: any) {
          emailStatus = 'FAILED';
          emailError = err.message || 'Email delivery failed';
        }
      }

      // Send WhatsApp
      if (sendWhatsapp && recipientPhone) {
        try {
          const waMessage = `⚠️ *${appName} Subscription Expiry Alert*\n\nDear *${ownerName}*,\nYour *${planName}* plan for *${tenantName}* is expiring ${daysLeft <= 0 ? 'today' : `in *${daysLeft} days*`} (on *${formattedDate}*).\n\n💰 Renewal Amount: ₹${item.priceMonthly || 0}\n\nPlease renew promptly to avoid any interruption in your orders, staff access, and messaging.\n\n— Team ${appName}`;
          await this.whatsappService.sendTextMessage(recipientPhone, waMessage);
          whatsappStatus = 'SENT';
          whatsappSentCount++;
        } catch (err: any) {
          whatsappStatus = 'FAILED';
          whatsappError = err.message || 'WhatsApp delivery failed';
        }
      }

      results.push({
        subscriptionId: item.subscriptionId,
        tenantId: item.tenantId,
        tenantName,
        ownerName,
        recipientEmail,
        recipientPhone,
        daysRemaining: daysLeft,
        emailStatus,
        whatsappStatus,
        emailError,
        whatsappError,
      });
    }

    if (adminId) {
      await this.auditService.log({
        actorId: adminId,
        actorType: 'PLATFORM_ADMIN',
        action: 'SUBSCRIPTION_EXPIRY_NOTIFICATIONS_TRIGGERED',
        entity: 'BillingExpiry',
        entityId: 'EXPIRY_DISPATCHER',
        ipAddress: ip,
        details: {
          daysAhead,
          totalProcessed: targets.length,
          emailSentCount,
          whatsappSentCount,
        },
      });
    }

    return {
      success: true,
      totalProcessed: targets.length,
      emailSentCount,
      whatsappSentCount,
      daysAhead,
      results,
    };
  }

  /**
   * 8. Public Gateway Configuration (Public Key only, no secrets!)
   */
  async getGatewayPublicConfig() {
    const rzpIntegration = await this.prisma.platformIntegration.findUnique({
      where: { provider: 'RAZORPAY' as any },
    });

    const isEnabled = rzpIntegration?.isEnabled ?? true;
    const isTestMode = rzpIntegration?.isTestMode ?? true;
    const rzpCreds = (rzpIntegration?.credentials as any) || {};

    const keyId = rzpCreds.keyId || process.env.RAZORPAY_KEY_ID || 'rzp_test_Webin10Demo';

    return {
      success: true,
      provider: 'RAZORPAY',
      isEnabled,
      isTestMode,
      keyId,
      currency: 'INR',
      upiVpa: 'webin10@upi',
      merchantName: 'Webin10 Multi-Tenant Business OS',
    };
  }
}
