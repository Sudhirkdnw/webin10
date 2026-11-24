import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { PlatformRole } from '@webin10/shared-types';

export class UpdatePlatformAdminDto {
  @ApiProperty({ required: false, example: 'Priya V.' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, enum: PlatformRole })
  @IsOptional()
  @IsEnum(PlatformRole)
  role?: PlatformRole;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, example: 'NewSecretPass123!' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
