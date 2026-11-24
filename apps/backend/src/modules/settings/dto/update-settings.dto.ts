import { IsObject, IsOptional, IsBoolean, IsString, IsNumber } from 'class-validator';

export class UpdateSettingDto {
  @IsObject()
  value!: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class TestSmtpDto {
  @IsString()
  host!: string;

  @IsNumber()
  port!: number;

  @IsOptional()
  @IsBoolean()
  secure?: boolean;

  @IsString()
  username!: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsString()
  fromEmail!: string;

  @IsString()
  fromName!: string;

  @IsOptional()
  @IsString()
  replyTo?: string;

  @IsOptional()
  @IsString()
  testRecipient?: string;

  @IsOptional()
  @IsString()
  provider?: string;
}
