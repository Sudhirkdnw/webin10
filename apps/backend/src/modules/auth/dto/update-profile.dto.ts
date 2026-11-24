import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Sudhir Sharma' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 60)
  name!: string;
}
