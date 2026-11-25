import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateInvoiceDto {
  @ApiProperty({ description: 'Tenant UUID' })
  @IsUUID()
  @IsNotEmpty()
  tenantId!: string;

  @ApiProperty({ description: 'Subscription ID (optional)', required: false })
  @IsUUID()
  @IsOptional()
  subscriptionId?: string;

  @ApiProperty({ description: 'Plan Name (e.g. Pro Gym Enterprise)' })
  @IsString()
  @IsNotEmpty()
  planName!: string;

  @ApiProperty({ description: 'Subtotal Amount in INR (before tax)' })
  @IsNumber()
  @Min(0)
  amountSubtotal!: number;

  @ApiProperty({ description: 'GST Tax Percentage (default 18%)', required: false, default: 18 })
  @IsNumber()
  @IsOptional()
  taxPercentage?: number;

  @ApiProperty({ description: 'Payment Method (RAZORPAY, STRIPE, UPI, BANK_TRANSFER, MANUAL)', default: 'RAZORPAY', required: false })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({ description: 'Payment Reference / Transaction ID', required: false })
  @IsString()
  @IsOptional()
  paymentReference?: string;

  @ApiProperty({ description: 'Duration in days for billing period', required: false, default: 30 })
  @IsNumber()
  @IsOptional()
  billingPeriodDays?: number;

  @ApiProperty({ description: 'Customer GSTIN (if registered)', required: false })
  @IsString()
  @IsOptional()
  customerGstin?: string;

  @ApiProperty({ description: 'Customer Address override', required: false })
  @IsString()
  @IsOptional()
  customerAddress?: string;

  @ApiProperty({ description: 'Notes or internal remarks', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
