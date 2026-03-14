import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class UpdateStockDto {
  @IsInt()
  @Min(0)
  @Max(999999)
  @Type(() => Number)
  stock: number;
}

export class AdminOrderQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
