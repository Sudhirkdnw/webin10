import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateSupportAccessRequestDto {
  @ApiProperty({ example: 'uuid-of-tenant' })
  @IsUUID()
  @IsNotEmpty()
  tenantId!: string;

  @ApiProperty({ example: 'Customer reported an invoice payment sync failure on Razorpay; investigating invoice ledger' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiProperty({ example: 2, default: 2, description: 'Duration of access session in hours (1-24)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  durationHours?: number = 2;
}
