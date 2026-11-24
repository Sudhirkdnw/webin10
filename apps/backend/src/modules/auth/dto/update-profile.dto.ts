import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Sudhir Sharma' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 60)
  name!: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
