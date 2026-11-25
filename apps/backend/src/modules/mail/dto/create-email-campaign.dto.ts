import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmailCampaignDto {
  @ApiProperty({ description: 'Campaign Name', example: 'Diwali 50% Off Upgrade Blast' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Email Subject', example: 'Special Festive Offer: 50% OFF on Annual Membership! 🎁' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({ description: 'Template ID or Code (optional)', required: false })
  @IsString()
  @IsOptional()
  templateId?: string;

  @ApiProperty({ description: 'Target Segment: ALL_CUSTOMERS, ACTIVE_MEMBERS, EXPIRED_MEMBERS, LEADS', default: 'ALL_CUSTOMERS' })
  @IsString()
  @IsOptional()
  targetSegment?: string;

  @ApiProperty({ description: 'Custom HTML content or markdown for promotional campaign', required: false })
  @IsString()
  @IsOptional()
  contentHtml?: string;
}
