import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AssignCategoryModulesDto {
  @ApiProperty({ example: ['crm', 'attendance', 'billing', 'memberships'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  moduleKeys!: string[];
}
