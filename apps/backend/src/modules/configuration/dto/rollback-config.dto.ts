import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class RollbackConfigurationDto {
  @ApiProperty({ example: 2, description: 'Target version number to rollback to' })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  version!: number;

  @ApiProperty({ required: false, example: 'uuid-of-tenant' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ required: false, example: 'Rollback due to unwanted theme color regression' })
  @IsOptional()
  @IsString()
  reason?: string;
}
