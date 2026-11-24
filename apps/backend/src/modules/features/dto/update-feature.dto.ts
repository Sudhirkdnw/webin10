import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class UpdateFeatureFlagDto {
  @ApiProperty({ required: false, example: 'QR Attendance Scanner' })
  @IsOptional()
  @IsString()
  @Length(2, 60)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
