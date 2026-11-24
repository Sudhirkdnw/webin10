import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreatePlatformModuleDto {
  @ApiProperty({ example: 'appointments' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_-]+$/, { message: 'Module key must be lowercase letters, numbers, hyphens or underscores' })
  key!: string;

  @ApiProperty({ example: 'Appointments & Scheduling' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 60)
  name!: string;

  @ApiProperty({ example: 'Bookable appointments and calendar management for salons and studios', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
