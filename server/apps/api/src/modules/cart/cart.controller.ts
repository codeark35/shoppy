import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Req, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { CartService } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';
import { JwtAuthGuard, CurrentUser } from '@libs/common';

// Nombre de la cookie de sesión anónima
const SESSION_COOKIE = 'session_id';
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
};

function getOrCreateSessionId(req: any, reply: any): string {
  let sessionId = req.cookies?.[SESSION_COOKIE];
  if (!sessionId) {
    sessionId = uuidv4();
    reply.setCookie(SESSION_COOKIE, sessionId, SESSION_COOKIE_OPTIONS);
  }
  return sessionId;
}

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // ─── Carrito anónimo (sin autenticación) ──────────────────────────────────────

  @Get()
  getAnonCart(@Req() req: any, @Req() reply: any) {
    const sessionId = getOrCreateSessionId(req, reply);
    return this.cartService.getAnonCart(sessionId);
  }

  @Post('items')
  addAnonItem(@Req() req: any, @Body() dto: AddCartItemDto) {
    const sessionId = req.cookies?.[SESSION_COOKIE] || uuidv4();
    return this.cartService.addItemAnon(sessionId, dto);
  }

  @Patch('items/:variantId')
  updateAnonItem(
    @Req() req: any,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const sessionId = req.cookies?.[SESSION_COOKIE] || '';
    return this.cartService.updateItemAnon(sessionId, variantId, dto);
  }

  @Delete('items/:variantId')
  @HttpCode(HttpStatus.OK)
  removeAnonItem(@Req() req: any, @Param('variantId') variantId: string) {
    const sessionId = req.cookies?.[SESSION_COOKIE] || '';
    return this.cartService.removeItemAnon(sessionId, variantId);
  }

  // ─── Carrito autenticado ──────────────────────────────────────────────────────

  @Get('user')
  @UseGuards(JwtAuthGuard)
  getUserCart(@CurrentUser('id') userId: string) {
    return this.cartService.getUserCart(userId);
  }

  @Post('user/items')
  @UseGuards(JwtAuthGuard)
  addUserItem(@CurrentUser('id') userId: string, @Body() dto: AddCartItemDto) {
    return this.cartService.addItemUser(userId, dto);
  }

  @Patch('user/items/:variantId')
  @UseGuards(JwtAuthGuard)
  updateUserItem(
    @CurrentUser('id') userId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemUser(userId, variantId, dto);
  }

  @Delete('user/items/:variantId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  removeUserItem(@CurrentUser('id') userId: string, @Param('variantId') variantId: string) {
    return this.cartService.removeItemUser(userId, variantId);
  }

  // ─── Merge post-login ─────────────────────────────────────────────────────────
  // Llamar inmediatamente después del login para fusionar el carrito anónimo

  @Post('merge')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  mergeCart(@Req() req: any, @CurrentUser('id') userId: string) {
    const sessionId = req.cookies?.[SESSION_COOKIE] || '';
    if (!sessionId) return this.cartService.getUserCart(userId);
    return this.cartService.mergeAnonIntoUser(sessionId, userId);
  }
}
