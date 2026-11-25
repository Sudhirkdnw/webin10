import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { ListInvoicesDto } from './dto/list-invoices.dto';
import { JwtPlatformGuard } from '@/common/guards/jwt-platform.guard';
import { PlatformRoleGuard } from '@/common/guards/platform-role.guard';
import { RequirePlatformRoles } from '@/common/decorators/require-roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PlatformRole, AuthenticatedUser } from '@webin10/shared-types';

@ApiTags('Super Admin SaaS Revenue & Billing Hub')
@Controller()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('super-admin/billing/metrics')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
    PlatformRole.PLATFORM_FINANCE,
    PlatformRole.PLATFORM_OPERATIONS,
  )
  @ApiOperation({ summary: 'Get SaaS MRR, ARR, Lifetime Revenue, and ARPU financial metrics' })
  async getMetrics() {
    return this.billingService.getRevenueMetrics();
  }

  @Get('super-admin/billing/expiring')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
    PlatformRole.PLATFORM_FINANCE,
    PlatformRole.PLATFORM_SUPPORT,
  )
  @ApiOperation({ summary: 'List subscriptions expiring in the next 7 days' })
  async getExpiring(@Query('days') days?: string) {
    const daysAhead = days ? parseInt(days, 10) : 7;
    return this.billingService.getExpiringSubscriptions(daysAhead);
  }

  @Post('super-admin/billing/trigger-expiry-alerts')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
    PlatformRole.PLATFORM_FINANCE,
  )
  @ApiOperation({ summary: 'Trigger automated WhatsApp and Email plan expiry alerts to expiring businesses' })
  async triggerExpiryAlerts(
    @Body() dto: { daysAhead?: number; sendEmail?: boolean; sendWhatsapp?: boolean; specificSubscriptionId?: string },
    @CurrentUser() admin: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return this.billingService.triggerExpiryAlerts(dto, admin.id, ip);
  }

  @Get('super-admin/billing/invoices')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
    PlatformRole.PLATFORM_FINANCE,
  )
  @ApiOperation({ summary: 'List generated GST Tax Invoices' })
  async listInvoices(@Query() dto: ListInvoicesDto) {
    return this.billingService.listInvoices(dto);
  }

  @Get('super-admin/billing/invoices/:id')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
    PlatformRole.PLATFORM_FINANCE,
    PlatformRole.PLATFORM_SUPPORT,
  )
  @ApiOperation({ summary: 'Get single Tax Invoice details with Indian GST breakdown' })
  async getInvoiceById(@Param('id') id: string) {
    return this.billingService.getInvoiceById(id);
  }

  @Post('super-admin/billing/invoices/generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER, PlatformRole.PLATFORM_FINANCE)
  @ApiOperation({ summary: 'Generate a new GST Tax Invoice for a tenant' })
  async generateInvoice(
    @Body() dto: GenerateInvoiceDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.billingService.generateInvoice(dto, admin.id, ip);
  }

  @Post('super-admin/billing/renew/:subscriptionId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER, PlatformRole.PLATFORM_FINANCE)
  @ApiOperation({ summary: '1-Click Renew Subscription & Auto-Generate GST Tax Invoice' })
  async renewSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.billingService.renewSubscription(subscriptionId, admin.id, ip);
  }

  /**
   * Public Webhook Endpoint for Payment Gateways (Razorpay, Cashfree & Stripe)
   */
  @Post('webhooks/payment/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Public Payment Gateway Webhook Listener (Razorpay / Cashfree / Stripe)' })
  async handlePaymentWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Headers('x-razorpay-signature') razorpaySig?: string,
    @Headers('x-webhook-signature') cashfreeSig?: string,
    @Headers('x-cashfree-signature') cfSig?: string,
    @Headers('stripe-signature') stripeSig?: string,
  ) {
    const signature = razorpaySig || cashfreeSig || cfSig || stripeSig;
    return this.billingService.handlePaymentWebhook(provider, payload, signature);
  }
}
