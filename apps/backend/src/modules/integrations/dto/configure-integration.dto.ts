import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export enum IntegrationProviderEnum {
  RAZORPAY = 'RAZORPAY',
  CASHFREE = 'CASHFREE',
  META_WHATSAPP = 'META_WHATSAPP',
  MSG91 = 'MSG91',
  AWS_SES = 'AWS_SES',
  RESEND = 'RESEND',
}

export class ConfigureIntegrationDto {
  @ApiProperty({ enum: IntegrationProviderEnum, example: IntegrationProviderEnum.RAZORPAY })
  @IsEnum(IntegrationProviderEnum)
  @IsNotEmpty()
  provider!: IntegrationProviderEnum;

  @ApiProperty({ example: true })
  @IsBoolean()
  isEnabled!: boolean;

  @ApiProperty({ example: true, description: 'True for sandbox/test mode, false for production' })
  @IsBoolean()
  isTestMode!: boolean;

  @ApiProperty({
    example: { keyId: 'rzp_test_...', keySecret: '...' },
    description: 'Provider API keys or webhook secrets',
  })
  @IsObject()
  credentials!: Record<string, any>;

  @ApiProperty({
    required: false,
    example: { webhookUrl: 'https://api.webin10.com/api/v1/webhooks/razorpay' },
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
