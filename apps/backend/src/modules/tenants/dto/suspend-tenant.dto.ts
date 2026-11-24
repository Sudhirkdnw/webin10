import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SuspendTenantDto {
  @ApiProperty({ example: 'Non-payment of SaaS subscription fee after grace period' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reason!: string;
}
