import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TenantRegistrationService } from './tenant-registration.service';

@ApiTags('Public - Tenant Self-Service Registration')
@Controller('public/tenants')
export class TenantRegistrationController {
  constructor(private readonly registrationService: TenantRegistrationService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Get available business vertical categories (No auth required)' })
  async getCategories() {
    return this.registrationService.getCategories();
  }

  @Post('register/send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate business registration and dispatch Dual OTPs (Email + Phone)' })
  async sendRegistrationOtps(
    @Body()
    dto: {
      businessName: string;
      categorySlug: string;
      ownerName: string;
      ownerEmail: string;
      ownerPhone: string;
      city?: string;
      password?: string;
    },
  ) {
    return this.registrationService.sendRegistrationOtps(dto);
  }

  @Post('register/resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend Email or Phone OTP' })
  async resendOtp(
    @Body()
    dto: {
      registrationToken: string;
      target?: 'EMAIL' | 'PHONE' | 'BOTH';
    },
  ) {
    return this.registrationService.resendOtp(dto.registrationToken, dto.target);
  }

  @Post('register/verify')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Verify Dual OTPs and provision Tenant Workspace & Owner account' })
  async verifyAndRegister(
    @Body()
    dto: {
      registrationToken: string;
      emailOtp: string;
      phoneOtp: string;
    },
  ) {
    return this.registrationService.verifyAndRegister(dto);
  }
}
