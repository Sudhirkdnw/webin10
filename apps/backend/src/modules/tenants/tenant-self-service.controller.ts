import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
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
}
