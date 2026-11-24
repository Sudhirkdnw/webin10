import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';

export class TenantFeatureOverrideDto {
  @ApiProperty({ example: 'uuid-of-tenant' })
  @IsUUID()
  @IsNotEmpty()
  tenantId!: string;

  @ApiProperty({ example: 'uuid-of-flag' })
  @IsUUID()
  @IsNotEmpty()
  flagId!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isEnabled!: boolean;
}
