import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Iron Fitness Gym' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string;

  @ApiProperty({ example: 'gym' })
  @IsString()
  @IsNotEmpty()
  categorySlug!: string;

  @ApiProperty({ example: 'owner@ironfitness.com' })
  @IsEmail()
  ownerEmail!: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Must be a valid 10-digit Indian mobile number' })
  ownerPhone!: string;

  @ApiProperty({ example: 'Rahul Sharma' })
  @IsString()
  @IsNotEmpty()
  ownerName!: string;

  @ApiProperty({ required: false, example: 'Main Branch' })
  @IsOptional()
  @IsString()
  branchName?: string;

  @ApiProperty({ required: false, example: 'starter' })
  @IsOptional()
  @IsString()
  planSlug?: string;
}
