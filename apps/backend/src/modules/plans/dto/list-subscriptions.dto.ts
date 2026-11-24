import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SubscriptionStatusEnum } from './assign-subscription.dto';

export class ListSubscriptionsDto {
  @ApiProperty({ required: false, enum: SubscriptionStatusEnum })
  @IsOptional()
  @IsEnum(SubscriptionStatusEnum)
  status?: SubscriptionStatusEnum;

  @ApiProperty({ required: false, example: 'growth' })
  @IsOptional()
  @IsString()
  planSlug?: string;

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
