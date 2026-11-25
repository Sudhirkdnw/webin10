import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmailMessageStatus } from '@prisma/client';

export class ListEmailLogsDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ enum: EmailMessageStatus, required: false })
  @IsEnum(EmailMessageStatus)
  @IsOptional()
  status?: EmailMessageStatus;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  limit?: number;
}
