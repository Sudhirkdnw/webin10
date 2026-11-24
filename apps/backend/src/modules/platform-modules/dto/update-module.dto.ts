import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class UpdatePlatformModuleDto {
  @ApiProperty({ required: false, example: 'Appointments & Consultations' })
  @IsOptional()
  @IsString()
  @Length(2, 60)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
