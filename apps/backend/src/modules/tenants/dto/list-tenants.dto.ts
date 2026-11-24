import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TenantStatus } from '@webin10/shared-types';

export class ListTenantsDto {
  @ApiProperty({ required: false, example: 'gym' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, enum: TenantStatus })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @ApiProperty({ required: false, example: 'gym' })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
