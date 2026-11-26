import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, ValidateCouponDto } from './dto/create-coupon.dto';
import { JwtPlatformGuard } from '@/common/guards/jwt-platform.guard';
import { PlatformRoleGuard } from '@/common/guards/platform-role.guard';
import { RequirePlatformRoles } from '@/common/decorators/require-roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PlatformRole, AuthenticatedUser } from '@webin10/shared-types';

@ApiTags('Super Admin - Coupons & Promo Codes')
@Controller()
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get('super-admin/coupons/metrics')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER, PlatformRole.PLATFORM_FINANCE)
  @ApiOperation({ summary: 'Get summary metrics of promotional coupons' })
  async getMetrics() {
    return this.couponsService.getCouponMetrics();
  }

  @Get('super-admin/coupons')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER, PlatformRole.PLATFORM_FINANCE)
  @ApiOperation({ summary: 'List all platform promotional coupons' })
  async listCoupons() {
    return this.couponsService.listCoupons();
  }

  @Get('super-admin/coupons/:id')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Get details of a specific coupon' })
  async getById(@Param('id') id: string) {
    return this.couponsService.getCouponById(id);
  }

  @Post('super-admin/coupons')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Create a new promotional coupon' })
  async create(
    @Body() dto: CreateCouponDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return this.couponsService.createCoupon(dto, admin.id, ip);
  }

  @Put('super-admin/coupons/:id')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Update an existing coupon' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCouponDto>,
    @CurrentUser() admin: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return this.couponsService.updateCoupon(id, dto, admin.id, ip);
  }

  @Post('super-admin/coupons/:id/toggle')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Toggle coupon active status' })
  async toggle(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return this.couponsService.toggleCoupon(id, admin.id, ip);
  }

  @Delete('super-admin/coupons/:id')
  @ApiBearerAuth()
  @UseGuards(JwtPlatformGuard, PlatformRoleGuard)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Delete a promotional coupon' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return this.couponsService.deleteCoupon(id, admin.id, ip);
  }

  @Get('public/coupons/validate')
  @ApiOperation({ summary: 'Validate a coupon during checkout via GET query (Public)' })
  async validateGet(
    @Query('code') code: string,
    @Query('planSlug') planSlug?: string,
    @Query('planPrice') planPrice?: string,
  ) {
    return this.couponsService.validateCoupon({
      code,
      planSlug,
      planPrice: planPrice ? Number(planPrice) : undefined,
    });
  }

  @Post('public/coupons/validate')
  @ApiOperation({ summary: 'Validate a coupon during checkout (Public)' })
  async validate(@Body() dto: ValidateCouponDto) {
    return this.couponsService.validateCoupon(dto);
  }
}
