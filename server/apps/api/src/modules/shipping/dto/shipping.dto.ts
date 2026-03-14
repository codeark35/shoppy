import { IsString, IsNumber, Min, Max, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateShippingZoneDto {
  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  departments: string[];
}

export class CreateShippingRateDto {
  @IsString()
  zoneId: string;

  @IsString()
  name: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(30)
  estimatedDays: number;
}

export class GetRatesQueryDto {
  @IsOptional()
  @IsString()
  department?: string;
}

export class ToggleActiveDto {
  @IsBoolean()
  isActive: boolean;
}
