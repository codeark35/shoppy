import {
  Controller, Get, Patch, Post, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto, CreateAddressDto } from './dto/users.dto';
import { JwtAuthGuard, CurrentUser } from '@libs/common';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get('me/addresses')
  getAddresses(@CurrentUser('id') userId: string) {
    return this.usersService.getAddresses(userId);
  }

  @Post('me/addresses')
  createAddress(@CurrentUser('id') userId: string, @Body() dto: CreateAddressDto) {
    return this.usersService.createAddress(userId, dto);
  }

  @Delete('me/addresses/:id')
  deleteAddress(@CurrentUser('id') userId: string, @Param('id') addressId: string) {
    return this.usersService.deleteAddress(userId, addressId);
  }

  // ─── Wishlist ────────────────────────────────────────────────────────────

  @Get('me/wishlist')
  getWishlist(@CurrentUser('id') userId: string) {
    return this.usersService.getWishlist(userId);
  }

  @Post('me/wishlist/:productId')
  addToWishlist(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.usersService.addToWishlist(userId, productId);
  }

  @Delete('me/wishlist/:productId')
  removeFromWishlist(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.usersService.removeFromWishlist(userId, productId);
  }
}
