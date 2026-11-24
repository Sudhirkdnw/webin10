import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum SubscriptionStatusEnum {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

export class AssignSubscriptionDto {
  @ApiProperty({ example: 'uuid-of-tenant' })
  @IsUUID()
  @IsNotEmpty()
  tenantId!: string;

  @ApiProperty({ example: 'growth' })
  @IsString()
  @IsNotEmpty()
  planSlug!: string;

  @ApiProperty({ required: false, default: 30, description: 'Duration in days' })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number = 30;

  @ApiProperty({ required: false, enum: SubscriptionStatusEnum, default: SubscriptionStatusEnum.ACTIVE })
  @IsOptional()
  @IsEnum(SubscriptionStatusEnum)
  status?: SubscriptionStatusEnum = SubscriptionStatusEnum.ACTIVE;
}
