import {
  IsString, IsOptional, IsEnum, IsNumber, IsIn, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AnalyticsEventType } from '@prisma/client';

export class TrackEventDto {
  @IsEnum(AnalyticsEventType)
  type: AnalyticsEventType;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  bannerId?: string;

  @IsOptional()
  @IsString()
  searchQuery?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  value?: number;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class AnalyticsQueryDto {
  @IsOptional()
  @IsIn(['today', 'week', 'month', 'year', 'custom'])
  period?: 'today' | 'week' | 'month' | 'year' | 'custom';

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}
