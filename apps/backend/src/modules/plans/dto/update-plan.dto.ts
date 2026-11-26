import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateSubscriptionPlanDto {
  @ApiProperty({ required: false, example: 'Growth Plus' })
  @IsOptional()
  @IsString()
  @Length(2, 60)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: 149900 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceMonthly?: number;

  @ApiProperty({ required: false, example: 1499000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceAnnual?: number;

  @ApiProperty({ required: false, example: [{ name: 'Priority Support', value: '24x7 SLA' }] })
  @IsOptional()
  customQuotas?: any;

  @ApiProperty({ required: false, example: 1000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxCustomers?: number;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxStaff?: number;

  @ApiProperty({ required: false, example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxBranches?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
