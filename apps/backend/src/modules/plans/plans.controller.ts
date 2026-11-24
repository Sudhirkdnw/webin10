import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PlansService } from './plans.service';
import { CreateSubscriptionPlanDto } from './dto/create-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-plan.dto';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { ListSubscriptionsDto } from './dto/list-subscriptions.dto';
import { JwtPlatformGuard } from '@/common/guards/jwt-platform.guard';
import { PlatformRoleGuard } from '@/common/guards/platform-role.guard';
import { RequirePlatformRoles } from '@/common/decorators/require-roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PlatformRole, AuthenticatedUser } from '@webin10/shared-types';

@ApiTags('Super Admin Subscription Plans')
@ApiBearerAuth()
@UseGuards(JwtPlatformGuard, PlatformRoleGuard)
@Controller('super-admin')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get('plans')
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
    PlatformRole.PLATFORM_FINANCE,
    PlatformRole.PLATFORM_SUPPORT,
  )
  @ApiOperation({ summary: 'List all SaaS subscription plans' })
  async listPlans(@Query('includeInactive') includeInactive?: string) {
    return this.plansService.listPlans(includeInactive === 'true');
  }

  @Get('plans/:id')
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Get SaaS subscription plan details by ID' })
  async getPlanById(@Param('id') id: string) {
    return this.plansService.getPlanById(id);
  }

  @Post('plans')
  @HttpCode(HttpStatus.CREATED)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER, PlatformRole.PLATFORM_FINANCE)
  @ApiOperation({ summary: 'Create a new SaaS subscription tier/plan' })
  async createPlan(
    @Body() dto: CreateSubscriptionPlanDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.plansService.createPlan(dto, admin.id, ip);
  }

  @Patch('plans/:id')
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER, PlatformRole.PLATFORM_FINANCE)
  @ApiOperation({ summary: 'Update plan pricing, customer/staff/branch limits, or status' })
  async updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionPlanDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.plansService.updatePlan(id, dto, admin.id, ip);
  }

  @Get('subscriptions')
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
    PlatformRole.PLATFORM_FINANCE,
    PlatformRole.PLATFORM_SUPPORT,
  )
  @ApiOperation({ summary: 'List tenant active/trial/expired subscriptions' })
  async listSubscriptions(@Query() query: ListSubscriptionsDto) {
    return this.plansService.listTenantSubscriptions(query);
  }

  @Post('subscriptions/assign')
  @HttpCode(HttpStatus.OK)
  @RequirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OWNER, PlatformRole.PLATFORM_FINANCE)
  @ApiOperation({ summary: 'Assign, extend, or upgrade a subscription plan for a tenant' })
  async assignSubscription(
    @Body() dto: AssignSubscriptionDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.plansService.assignTenantSubscription(dto, admin.id, ip);
  }

  @Get('subscriptions/quota/:tenantId')
  @RequirePlatformRoles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.PLATFORM_OWNER,
    PlatformRole.PLATFORM_SUPPORT,
  )
  @ApiOperation({ summary: 'Check tenant plan quota and resource usage limits' })
  async checkQuota(@Param('tenantId') tenantId: string) {
    return this.plansService.checkTenantQuota(tenantId);
  }
}
