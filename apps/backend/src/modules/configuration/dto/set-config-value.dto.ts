import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SetConfigurationValueDto {
  @ApiProperty({ example: 'Asia/Kolkata' })
  @IsString()
  @IsNotEmpty()
  value!: string;

  @ApiProperty({ required: false, example: 'uuid-of-tenant', description: 'Omit for platform-level default' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ required: false, example: 'Updated default business timezone for Indian standard time' })
  @IsOptional()
  @IsString()
  reason?: string;
}
