import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Martial Arts Academy' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 60)
  name!: string;

  @ApiProperty({ example: 'martial-arts', required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 'Karate, Taekwondo, MMA and combat sports training institutes', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: ['crm', 'attendance', 'billing'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  defaultModuleKeys?: string[];
}
