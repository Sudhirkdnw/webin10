import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { ListInvoicesDto } from './dto/list-invoices.dto';
import * as crypto from 'crypto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
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

    for (const sub of subscriptions) {
      if (sub.tenant?.status === 'ACTIVE') {
        activeSubscribersCount++;
        // If priceMonthly is in paise (e.g. 299900) or rupees (e.g. 2999)
        const price = sub.plan ? (sub.plan.priceMonthly > 50000 ? sub.plan.priceMonthly / 100 : sub.plan.priceMonthly) : 0;
        mrrInr += price;
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
  async renewSubscription(subscriptionId: string, adminId: string, ip?: string) {
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
        paymentMethod: 'RAZORPAY',
        paymentReference: `RNW_${Date.now()}`,
        billingPeriodDays: 30,
        notes: `Subscription renewed by Super Admin. New expiry: ${newEnd.toLocaleDateString()}`,
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
   * 7. Payment Gateway Webhook Handler (Razorpay & Stripe)
   */
  async handlePaymentWebhook(provider: string, payload: any, signature?: string) {
    this.logger.log(`Received ${provider} payment webhook: ${payload?.event || 'generic'}`);

    // If Razorpay webhook
    if (provider.toLowerCase() === 'razorpay') {
      const event = payload?.event;
      if (event === 'payment.captured' || event === 'order.paid') {
        const payment = payload?.payload?.payment?.entity || payload?.payload?.order?.entity;
        const tenantId = payment?.notes?.tenant_id || payment?.notes?.tenantId;
        const amountPaise = payment?.amount || 0;
        const amountRupees = amountPaise / 100;
        const paymentId = payment?.id || `PAY_${Date.now()}`;

        if (tenantId) {
          const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1, include: { plan: true } } },
          });

          if (tenant) {
            const sub = tenant.subscriptions[0];
            if (sub) {
              await this.renewSubscription(sub.id, 'SYSTEM_WEBHOOK');
            } else {
              await this.generateInvoice({
                tenantId: tenant.id,
                planName: 'Online Webhook Payment',
                amountSubtotal: amountRupees / 1.18, // backwards calculate subtotal from 18% inclusive
                taxPercentage: 18,
                paymentMethod: 'RAZORPAY',
                paymentReference: paymentId,
              });
            }
          }
        }
      }
    }

    return { received: true, timestamp: new Date().toISOString() };
  }
}
