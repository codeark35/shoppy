import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@libs/prisma';
import { CreateReviewDto } from './dto/reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProductReviews(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId, isApproved: true },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const avg = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return { reviews, averageRating: Math.round(avg * 10) / 10, total: reviews.length };
  }

  async createReview(userId: string, dto: CreateReviewDto) {
    const exists = await this.prisma.review.findUnique({
      where: { userId_productId: { userId, productId: dto.productId } },
    });
    if (exists) throw new ConflictException('Ya existe una reseña tuya para este producto');

    return this.prisma.review.create({
      data: { userId, productId: dto.productId, rating: dto.rating, comment: dto.comment },
    });
  }

  async approveReview(id: string) {
    return this.prisma.review.update({ where: { id }, data: { isApproved: true } });
  }

  async deleteReview(id: string, userId: string, isAdmin: boolean) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Reseña no encontrada');
    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('No puedes eliminar esta reseña');
    }
    return this.prisma.review.delete({ where: { id } });
  }

  async getPendingReviews() {
    return this.prisma.review.findMany({
      where: { isApproved: false },
      include: { user: { select: { id: true, name: true } }, product: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
