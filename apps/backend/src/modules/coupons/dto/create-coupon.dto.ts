import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, IsDateString } from 'class-validator';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  discountType?: 'PERCENTAGE' | 'FIXED';

  @IsNumber()
  discountValue!: number;

  @IsNumber()
  @IsOptional()
  maxDiscount?: number;

  @IsNumber()
  @IsOptional()
  minPurchase?: number;

  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @IsNumber()
  @IsOptional()
  usageLimit?: number;

  @IsNumber()
  @IsOptional()
  perTenantLimit?: number;

  @IsArray()
  @IsOptional()
  applicablePlans?: string[];

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsNumber()
  @IsOptional()
  planPrice?: number;

  @IsString()
  @IsOptional()
  planId?: string;

  @IsString()
  @IsOptional()
  planSlug?: string;
}
