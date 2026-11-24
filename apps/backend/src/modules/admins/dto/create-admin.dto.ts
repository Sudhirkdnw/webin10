import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { PlatformRole } from '@webin10/shared-types';

export class CreatePlatformAdminDto {
  @ApiProperty({ example: 'support.lead@webin10.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'TemporaryPass123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Priya Verma' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: PlatformRole, example: PlatformRole.PLATFORM_SUPPORT })
  @IsEnum(PlatformRole)
  role!: PlatformRole;
}
