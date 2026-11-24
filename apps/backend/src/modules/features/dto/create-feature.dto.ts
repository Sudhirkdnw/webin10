import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateFeatureFlagDto {
  @ApiProperty({ example: 'qr_attendance' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_-]+$/, { message: 'Feature key must be lowercase letters, numbers, hyphens or underscores' })
  key!: string;

  @ApiProperty({ example: 'QR Code Attendance Check-in' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 60)
  name!: string;

  @ApiProperty({ example: 'Allows customers to check in via dynamic QR code scanning at entrance', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
