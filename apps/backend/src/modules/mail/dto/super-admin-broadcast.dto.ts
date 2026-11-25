import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';

export enum SuperAdminBroadcastAudience {
  ALL_GYMS = 'ALL_GYMS',
  ACTIVE_GYMS = 'ACTIVE_GYMS',
  INACTIVE_GYMS = 'INACTIVE_GYMS',
  SPECIFIC_GYM = 'SPECIFIC_GYM',
}

export class SuperAdminBroadcastDto {
  @ApiProperty({ description: 'Campaign name or internal label' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Email subject line' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({ enum: SuperAdminBroadcastAudience, default: SuperAdminBroadcastAudience.ALL_GYMS })
  @IsEnum(SuperAdminBroadcastAudience)
  targetAudience!: SuperAdminBroadcastAudience;

  @ApiPropertyOptional({ description: 'Specific Tenant ID if targetAudience is SPECIFIC_GYM' })
  @IsOptional()
  @IsUUID()
  specificTenantId?: string;

  @ApiPropertyOptional({ description: 'Optional template ID to base email on' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiProperty({ description: 'HTML or text content of the broadcast email' })
  @IsString()
  @IsNotEmpty()
  contentHtml!: string;
}

export class SuperAdminSendDirectEmailDto {
  @ApiProperty({ description: 'Recipient email address' })
  @IsString()
  @IsNotEmpty()
  recipientEmail!: string;

  @ApiPropertyOptional({ description: 'Recipient name' })
  @IsOptional()
  @IsString()
  recipientName?: string;

  @ApiProperty({ description: 'Email subject' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({ description: 'HTML content' })
  @IsString()
  @IsNotEmpty()
  contentHtml!: string;

  @ApiPropertyOptional({ description: 'Associated gym/tenant ID if applicable' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Template slug if using pre-made template' })
  @IsOptional()
  @IsString()
  templateSlug?: string;
}

export class UpdateSmtpConfigDto {
  @ApiPropertyOptional({ description: 'Email service provider, e.g. google, ses, custom' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiProperty({ description: 'SMTP host, e.g. smtp.gmail.com' })
  @IsString()
  @IsNotEmpty()
  host!: string;

  @ApiProperty({ description: 'SMTP port, e.g. 587 or 465' })
  @IsNotEmpty()
  port!: number;

  @ApiPropertyOptional({ description: 'Use SSL/TLS secure connection' })
  @IsOptional()
  secure?: boolean;

  @ApiProperty({ description: 'SMTP username/email' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiPropertyOptional({ description: 'SMTP password or 16-char app password' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ description: 'Sender email address' })
  @IsString()
  @IsNotEmpty()
  fromEmail!: string;

  @ApiProperty({ description: 'Sender display name' })
  @IsString()
  @IsNotEmpty()
  fromName!: string;

  @ApiPropertyOptional({ description: 'Reply-To email address' })
  @IsOptional()
  @IsString()
  replyTo?: string;
}
