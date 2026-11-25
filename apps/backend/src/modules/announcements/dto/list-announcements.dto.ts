import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AnnouncementType, AnnouncementDisplayType } from '@prisma/client';

export class ListAnnouncementsDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ enum: AnnouncementType, required: false })
  @IsEnum(AnnouncementType)
  @IsOptional()
  type?: AnnouncementType;

  @ApiProperty({ enum: AnnouncementDisplayType, required: false })
  @IsEnum(AnnouncementDisplayType)
  @IsOptional()
  displayType?: AnnouncementDisplayType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  status?: 'active' | 'scheduled' | 'expired' | 'inactive';
}
