import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
  IsInt,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  AnnouncementType,
  AnnouncementDisplayType,
  AnnouncementAudience,
} from '@prisma/client';

export class CreateAnnouncementDto {
  @ApiProperty({ description: 'Announcement Title', example: 'Webin10 AI Diet Planner Launch!' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Detailed announcement message or markdown copy',
    example: 'We are thrilled to launch AI Diet Planner tonight at 12 AM for all gym partners. Enjoy auto-generated calorie charts!',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiProperty({
    enum: AnnouncementType,
    default: AnnouncementType.INFO,
    description: 'Notice type: INFO, SUCCESS, WARNING, CRITICAL, PROMOTION',
  })
  @IsEnum(AnnouncementType)
  @IsOptional()
  type?: AnnouncementType;

  @ApiProperty({
    enum: AnnouncementDisplayType,
    default: AnnouncementDisplayType.TOP_BANNER,
    description: 'Display style: TOP_BANNER or MODAL_POPUP',
  })
  @IsEnum(AnnouncementDisplayType)
  @IsOptional()
  displayType?: AnnouncementDisplayType;

  @ApiProperty({
    enum: AnnouncementAudience,
    default: AnnouncementAudience.ALL_BUSINESSES,
    description: 'Target Audience: ALL_BUSINESSES, SPECIFIC_CATEGORY, SPECIFIC_PLAN',
  })
  @IsEnum(AnnouncementAudience)
  @IsOptional()
  targetAudience?: AnnouncementAudience;

  @ApiProperty({ description: 'Category ID if targeted', required: false })
  @IsUUID()
  @IsOptional()
  targetCategoryId?: string;

  @ApiProperty({ description: 'Plan ID if targeted', required: false })
  @IsUUID()
  @IsOptional()
  targetPlanId?: string;

  @ApiProperty({ description: 'Call to action button text', required: false, example: 'Explore Feature' })
  @IsString()
  @IsOptional()
  ctaText?: string;

  @ApiProperty({ description: 'Call to action button URL or path', required: false, example: '/settings/features' })
  @IsString()
  @IsOptional()
  ctaUrl?: string;

  @ApiProperty({ description: 'Banner Graphic Image URL (Poster / Hero Banner)', required: false, example: 'https://images.unsplash.com/...' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ description: 'Whether clicking the image/banner opens in a new tab', default: false, required: false })
  @IsBoolean()
  @IsOptional()
  openInNewTab?: boolean;

  @ApiProperty({ description: 'Whether the business user can dismiss/close this banner', default: true })
  @IsBoolean()
  @IsOptional()
  isDismissible?: boolean;

  @ApiProperty({ description: 'Whether announcement is live', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Schedule start time (ISO)', required: false })
  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @ApiProperty({ description: 'Schedule expiration time (ISO)', required: false })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiProperty({ description: 'Priority order (higher shown first)', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;
}
