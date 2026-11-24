import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  bodyHtml!: string;

  @IsOptional()
  @IsString()
  bodyText?: string;

  @IsOptional()
  @IsArray()
  variables?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PreviewTemplateDto {
  @IsOptional()
  sampleData?: Record<string, string>;
}

export class SendTestEmailDto {
  @IsString()
  @IsNotEmpty()
  recipientEmail!: string;

  @IsOptional()
  sampleData?: Record<string, string>;
}
