import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtPlatformGuard } from '@/common/guards/jwt-platform.guard';
import { PlatformRoleGuard } from '@/common/guards/platform-role.guard';
import { RequirePlatformRoles } from '@/common/decorators/require-roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PlatformRole, AuthenticatedUser } from '@webin10/shared-types';
import { EmailTemplatesService } from './email-templates.service';
import { CreateTemplateDto, PreviewTemplateDto, SendTestEmailDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@ApiTags('Super Admin - Email Templates')
@ApiBearerAuth()
@UseGuards(JwtPlatformGuard, PlatformRoleGuard)
@Controller('super-admin/email-templates')
export class EmailTemplatesController {
  constructor(private readonly templatesService: EmailTemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List all email templates' })
  @RequirePlatformRoles(PlatformRole.PLATFORM_OWNER, PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OPERATIONS)
  async list() {
    return this.templatesService.listTemplates();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get email template details by ID' })
  @RequirePlatformRoles(PlatformRole.PLATFORM_OWNER, PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OPERATIONS)
  async getOne(@Param('id') id: string) {
    return this.templatesService.getTemplateById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new email template' })
  @RequirePlatformRoles(PlatformRole.PLATFORM_OWNER, PlatformRole.SUPER_ADMIN)
  async create(
    @Body() dto: CreateTemplateDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return this.templatesService.createTemplate(dto, admin.id, ip);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing email template' })
  @RequirePlatformRoles(PlatformRole.PLATFORM_OWNER, PlatformRole.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return this.templatesService.updateTemplate(id, dto, admin.id, ip);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an email template' })
  @RequirePlatformRoles(PlatformRole.PLATFORM_OWNER, PlatformRole.SUPER_ADMIN)
  async delete(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return this.templatesService.deleteTemplate(id, admin.id, ip);
  }

  @Post(':id/preview')
  @ApiOperation({ summary: 'Preview a rendered email template with variables' })
  @RequirePlatformRoles(PlatformRole.PLATFORM_OWNER, PlatformRole.SUPER_ADMIN, PlatformRole.PLATFORM_OPERATIONS)
  async preview(@Param('id') id: string, @Body() dto: PreviewTemplateDto) {
    return this.templatesService.previewTemplate(id, dto);
  }

  @Post(':id/send-test')
  @ApiOperation({ summary: 'Send a live test email using this template via SMTP' })
  @RequirePlatformRoles(PlatformRole.PLATFORM_OWNER, PlatformRole.SUPER_ADMIN)
  async sendTest(
    @Param('id') id: string,
    @Body() dto: SendTestEmailDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return this.templatesService.sendTestEmail(id, dto, admin.id, ip);
  }
}
