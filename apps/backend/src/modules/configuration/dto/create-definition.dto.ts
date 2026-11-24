import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateConfigurationDefinitionDto {
  @ApiProperty({ example: 'platform.branding.logo_url' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_.-]+$/, { message: 'Key must only contain lowercase letters, numbers, dots, underscores or hyphens' })
  key!: string;

  @ApiProperty({ example: 'Platform Logo URL' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 80)
  name!: string;

  @ApiProperty({ example: 'string', enum: ['string', 'number', 'boolean', 'json'] })
  @IsIn(['string', 'number', 'boolean', 'json'])
  dataType!: 'string' | 'number' | 'boolean' | 'json';

  @ApiProperty({ example: 'https://assets.webin10.com/logo.png' })
  @IsString()
  @IsNotEmpty()
  defaultValue!: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = false;

  @ApiProperty({ required: false, example: 'URL of the global platform logo' })
  @IsOptional()
  @IsString()
  description?: string;
}
