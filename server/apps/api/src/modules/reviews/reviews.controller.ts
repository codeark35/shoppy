import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/reviews.dto';
import { JwtAuthGuard, RolesGuard, Roles } from '@libs/common';
import { Role } from '@prisma/client';
import { FastifyRequest } from 'fastify';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /** GET /reviews/product/:productId */
  @Get('product/:productId')
  getProductReviews(@Param('productId') productId: string) {
    return this.reviewsService.getProductReviews(productId);
  }

  /** POST /reviews */
  @Post()
  @UseGuards(JwtAuthGuard)
  createReview(
    @Req() req: FastifyRequest & { user: { id: string } },
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(req.user.id, dto);
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getPendingReviews() {
    return this.reviewsService.getPendingReviews();
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  approveReview(@Param('id') id: string) {
    return this.reviewsService.approveReview(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteReview(
    @Param('id') id: string,
    @Req() req: FastifyRequest & { user: { id: string; role: string } },
  ) {
    return this.reviewsService.deleteReview(id, req.user.id, req.user.role === Role.ADMIN);
  }
}
