import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TenantSelfService } from './tenant-self-service.service';
import { TenantRole } from '@prisma/client';

@ApiTags('Tenant Self-Service Portal APIs')
@Controller('tenants/:tenantId')
export class TenantSelfServiceController {
  constructor(private readonly selfService: TenantSelfService) {}

  @Get('subscription')
  @ApiOperation({ summary: 'Get current subscription, plan usage & available plans for upgrade' })
  async getSubscription(@Param('tenantId') tenantId: string) {
    return this.selfService.getSubscriptionDetails(tenantId);
  }

  @Post('subscription/upgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upgrade or renew plan with optional discount promo code' })
  async upgradeSubscription(
    @Param('tenantId') tenantId: string,
    @Body() dto: { planSlug: string; couponCode?: string; billingCycle?: 'MONTHLY' | 'ANNUAL' },
  ) {
    return this.selfService.upgradeSubscription(tenantId, dto);
  }

  @Post('subscription/create-order')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Razorpay / UPI order for plan subscription checkout' })
  async createSubscriptionOrder(
    @Param('tenantId') tenantId: string,
    @Body() dto: { planSlug: string; couponCode?: string; billingCycle?: 'MONTHLY' | 'ANNUAL' },
  ) {
    return this.selfService.createSubscriptionOrder(tenantId, dto);
  }

  @Post('subscription/verify-payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify gateway payment and activate subscription plan' })
  async verifySubscriptionPayment(
    @Param('tenantId') tenantId: string,
    @Body()
    dto: {
      orderId: string;
      paymentId: string;
      signature?: string;
      planSlug: string;
      billingCycle?: 'MONTHLY' | 'ANNUAL';
      couponCode?: string;
      paymentMethod?: string;
    },
  ) {
    return this.selfService.verifySubscriptionPayment(tenantId, dto);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List all generated GST tax invoices for tenant' })
  async getInvoices(@Param('tenantId') tenantId: string) {
    return this.selfService.getInvoices(tenantId);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get business profile, address, GSTIN and branding' })
  async getProfile(@Param('tenantId') tenantId: string) {
    return this.selfService.getProfile(tenantId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update business profile, contact details and logo branding' })
  async updateProfile(
    @Param('tenantId') tenantId: string,
    @Body() dto: {
      name?: string;
      legalName?: string;
      taxId?: string;
      phone?: string;
      email?: string;
      address?: string;
      logoUrl?: string;
    },
  ) {
    return this.selfService.updateProfile(tenantId, dto);
  }

  @Get('members')
  @ApiOperation({ summary: 'List all staff and team members in workspace' })
  async getMembers(@Param('tenantId') tenantId: string) {
    return this.selfService.getMembers(tenantId);
  }

  @Post('members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite or add new staff member with assigned role' })
  async addMember(
    @Param('tenantId') tenantId: string,
    @Body() dto: { name: string; email: string; phone?: string; role: TenantRole },
  ) {
    return this.selfService.addMember(tenantId, dto);
  }

  @Patch('members/:memberId')
  @ApiOperation({ summary: 'Update staff member role' })
  async updateMemberRole(
    @Param('tenantId') tenantId: string,
    @Param('memberId') memberId: string,
    @Body() dto: { role: TenantRole },
  ) {
    return this.selfService.updateMemberRole(tenantId, memberId, dto.role);
  }

  @Delete('members/:memberId')
  @ApiOperation({ summary: 'Remove staff member from workspace' })
  async removeMember(
    @Param('tenantId') tenantId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.selfService.removeMember(tenantId, memberId);
  }

  @Get('modules')
  @ApiOperation({ summary: 'Get active and available feature modules for tenant workspace' })
  async getModules(@Param('tenantId') tenantId: string) {
    return this.selfService.getTenantModules(tenantId);
  }

  @Post('modules/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable or disable a specific feature module for tenant' })
  async toggleModule(
    @Param('tenantId') tenantId: string,
    @Body() dto: { moduleKey: string; isEnabled: boolean },
  ) {
    return this.selfService.toggleTenantModule(tenantId, dto.moduleKey, dto.isEnabled);
  }

  // ==========================================
  // MODULE PERSISTENCE: ATTENDANCE
  // ==========================================
  @Get('attendance')
  @ApiOperation({ summary: 'Get live attendance records for tenant' })
  async getAttendance(
    @Param('tenantId') tenantId: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.selfService.getAttendance(tenantId, date, status, search);
  }

  @Post('attendance')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record attendance punch or manual entry' })
  async recordAttendance(
    @Param('tenantId') tenantId: string,
    @Body() dto: {
      name: string;
      role?: string;
      phone?: string;
      checkInTime?: string;
      method?: string;
      status?: string;
      date?: string;
      whatsappSent?: boolean;
    },
  ) {
    return this.selfService.recordAttendance(tenantId, dto);
  }

  @Patch('attendance/:id/toggle')
  @ApiOperation({ summary: 'Toggle attendance status between PRESENT and ABSENT' })
  async toggleAttendance(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.selfService.toggleAttendanceStatus(tenantId, id);
  }

  // ==========================================
  // MODULE PERSISTENCE: UDHAR KHATA
  // ==========================================
  @Get('khata')
  @ApiOperation({ summary: 'Get customer udhar khata ledger entries' })
  async getKhata(
    @Param('tenantId') tenantId: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.selfService.getKhata(tenantId, search, status);
  }

  @Post('khata')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record customer udhar / khata credit or payment' })
  async createKhata(
    @Param('tenantId') tenantId: string,
    @Body() dto: {
      customerName: string;
      phone: string;
      amount: number;
      type?: string;
      notes?: string;
    },
  ) {
    return this.selfService.createKhataEntry(tenantId, dto);
  }

  @Patch('khata/:id/settle')
  @ApiOperation({ summary: 'Mark customer khata balance as settled' })
  async settleKhata(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.selfService.settleKhataEntry(tenantId, id);
  }

  @Post('khata/:id/reminder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispatch automated WhatsApp payment link reminder for khata entry' })
  async sendKhataReminder(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.selfService.sendKhataReminder(tenantId, id);
  }

  @Post('refills/reminder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispatch automated WhatsApp prescription refill reminder' })
  async sendRefillReminder(
    @Param('tenantId') tenantId: string,
    @Body() dto: {
      patientName: string;
      phone: string;
      medicines: string;
      dosageDays: string;
      nextDueDate: string;
      totalCost?: string;
    },
  ) {
    return this.selfService.sendRefillReminder(tenantId, dto);
  }

  // ==========================================
  // MODULE PERSISTENCE: APPOINTMENTS
  // ==========================================
  @Get('appointments')
  @ApiOperation({ summary: 'List customer appointments and booking desk slots' })
  async getAppointments(
    @Param('tenantId') tenantId: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.selfService.getAppointments(tenantId, date, status, search);
  }

  @Post('appointments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Book new appointment slot' })
  async createAppointment(
    @Param('tenantId') tenantId: string,
    @Body() dto: {
      clientName: string;
      phone: string;
      service: string;
      stylist?: string;
      timeSlot: string;
      slotDate?: string;
      amount?: string;
      notes?: string;
    },
  ) {
    return this.selfService.createAppointment(tenantId, dto);
  }

  @Patch('appointments/:id/status')
  @ApiOperation({ summary: 'Update appointment slot status' })
  async updateAppointmentStatus(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: { status: string },
  ) {
    return this.selfService.updateAppointmentStatus(tenantId, id, dto.status);
  }

  // ==========================================
  // MODULE PERSISTENCE: INVENTORY
  // ==========================================
  @Get('inventory')
  @ApiOperation({ summary: 'Get stock inventory catalog and levels' })
  async getInventory(
    @Param('tenantId') tenantId: string,
    @Query('search') search?: string,
  ) {
    return this.selfService.getInventory(tenantId, search);
  }

  @Post('inventory')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new SKU / inventory stock item' })
  async createInventoryItem(
    @Param('tenantId') tenantId: string,
    @Body() dto: {
      name: string;
      category?: string;
      sku: string;
      stock: number;
      minStock?: number;
      unitPrice?: string;
    },
  ) {
    return this.selfService.createInventoryItem(tenantId, dto);
  }

  // ==========================================
  // ONBOARDING WIZARD: STARTER DATA SEEDER
  // ==========================================
  @Post('onboarding/seed-starter')
  @ApiOperation({ summary: 'Populate initial category starter data for onboarding' })
  async seedStarterData(@Param('tenantId') tenantId: string) {
    return this.selfService.seedStarterData(tenantId);
  }
}

