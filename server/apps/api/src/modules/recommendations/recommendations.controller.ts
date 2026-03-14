import { Controller, Get, Param, Query } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

class LimitDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('products/:productId')
  getRelated(@Param('productId') productId: string, @Query() query: LimitDto) {
    return this.recommendationsService.getRelated(productId, query.limit);
  }

  @Get('products/:productId/frequently-bought')
  getFrequentlyBoughtTogether(
    @Param('productId') productId: string,
    @Query() query: LimitDto,
  ) {
    return this.recommendationsService.getFrequentlyBoughtTogether(
      productId,
      query.limit,
    );
  }
}
