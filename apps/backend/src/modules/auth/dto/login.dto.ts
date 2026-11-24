import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class SuperAdminLoginDto {
  @ApiProperty({ example: 'superadmin@webin10.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'ChangeMeInProduction123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ required: false, example: '123456' })
  @IsOptional()
  @IsString()
  mfaCode?: string;
}
