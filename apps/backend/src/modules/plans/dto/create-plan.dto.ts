import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Matches, Min } from 'class-validator';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'Enterprise' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 60)
  name!: string;

  @ApiProperty({ example: 'enterprise', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9_-]+$/, { message: 'Slug must be lowercase letters, numbers, hyphens or underscores' })
  slug?: string;

  @ApiProperty({ example: 'Custom enterprise plan for multi-branch gym franchises', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 499900, description: 'Monthly price in INR paise (e.g. ₹4,999 = 499900 paise)' })
  @IsInt()
  @Min(0)
  priceMonthly!: number;

  @ApiProperty({ example: 4999000, description: 'Annual price in INR paise (e.g. ₹49,990 = 4999000 paise)', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceAnnual?: number;

  @ApiProperty({ example: [{ name: 'WhatsApp Marketing', value: '5,000 / mo' }], description: 'Custom dynamic quotas and perks', required: false })
  @IsOptional()
  customQuotas?: any;

  @ApiProperty({ example: 5000, description: 'Maximum active customer records permitted' })
  @IsInt()
  @Min(1)
  maxCustomers!: number;

  @ApiProperty({ example: 30, description: 'Maximum staff / employee accounts permitted' })
  @IsInt()
  @Min(1)
  maxStaff!: number;

  @ApiProperty({ example: 10, description: 'Maximum physical branches permitted' })
  @IsInt()
  @Min(1)
  maxBranches!: number;
}
