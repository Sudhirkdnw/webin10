import { IsString, IsNotEmpty, IsEmail, IsOptional, IsObject, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendDirectEmailDto {
  @ApiProperty({ description: 'Recipient Email Address', example: 'rahul.sharma@example.com' })
  @IsEmail()
  @IsNotEmpty()
  recipientEmail!: string;

  @ApiProperty({ description: 'Recipient Name', required: false, example: 'Rahul Sharma' })
  @IsString()
  @IsOptional()
  recipientName?: string;

  @ApiProperty({ description: 'Customer ID (optional)', required: false })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ description: 'Template Slug (e.g. member_welcome, fee_receipt, festival_offer)', required: false })
  @IsString()
  @IsOptional()
  templateSlug?: string;

  @ApiProperty({ description: 'Email Subject', required: false, example: 'Welcome to FitZone Club! 🎉' })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ description: 'Custom HTML Body if not using a template', required: false })
  @IsString()
  @IsOptional()
  customHtml?: string;

  @ApiProperty({ description: 'Template Dynamic Variables', required: false, example: { member_name: 'Rahul', plan_name: 'Pro Gym' } })
  @IsObject()
  @IsOptional()
  variables?: Record<string, any>;
}
