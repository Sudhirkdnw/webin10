import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({ example: 'Martial Arts & Combat Sports', required: false })
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
