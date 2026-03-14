import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from '@libs/redis';
import { CatalogService } from '../catalog/catalog.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

export interface CartItem {
  variantId: string;
  sku: string;
  name: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
  attributes: Record<string, string>;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

// TTLs en segundos
const ANON_CART_TTL = 30 * 24 * 60 * 60;  // 30 días
const AUTH_CART_TTL = 7 * 24 * 60 * 60;   // 7 días

@Injectable()
export class CartService {
  constructor(
    private readonly redis: RedisService,
    private readonly catalogService: CatalogService,
  ) {}

  // ─── Claves Redis ─────────────────────────────────────────────────────────────

  private anonKey(sessionId: string) {
    return `cart:anon:${sessionId}`;
  }

  private userKey(userId: string) {
    return `cart:user:${userId}`;
  }

  // ─── Obtener carrito ──────────────────────────────────────────────────────────

  async getCart(key: string): Promise<Cart> {
    const raw = await this.redis.hgetall(key);
    if (!raw || Object.keys(raw).length === 0) {
      return { items: [], total: 0, itemCount: 0 };
    }

    const items: CartItem[] = Object.values(raw).map((v) => JSON.parse(v));
    return this.buildCartResponse(items);
  }

  async getAnonCart(sessionId: string): Promise<Cart> {
    return this.getCart(this.anonKey(sessionId));
  }

  async getUserCart(userId: string): Promise<Cart> {
    return this.getCart(this.userKey(userId));
  }

  // ─── Agregar ítem ─────────────────────────────────────────────────────────────

  async addItem(key: string, ttl: number, dto: AddCartItemDto): Promise<Cart> {
    const variant = await this.catalogService.getVariantById(dto.variantId);

    const existingRaw = await this.redis.hget(key, dto.variantId);
    let item: CartItem;

    if (existingRaw) {
      item = JSON.parse(existingRaw);
      item.quantity += dto.quantity;
    } else {
      item = {
        variantId: variant.id,
        sku: variant.sku,
        name: variant.product.name,
        imageUrl: null,
        price: Number(variant.price),
        quantity: dto.quantity,
        attributes: variant.attributes as Record<string, string>,
      };
    }

    await this.redis.hset(key, dto.variantId, JSON.stringify(item));
    await this.redis.expire(key, ttl);

    return this.getCart(key);
  }

  async addItemAnon(sessionId: string, dto: AddCartItemDto): Promise<Cart> {
    return this.addItem(this.anonKey(sessionId), ANON_CART_TTL, dto);
  }

  async addItemUser(userId: string, dto: AddCartItemDto): Promise<Cart> {
    return this.addItem(this.userKey(userId), AUTH_CART_TTL, dto);
  }

  // ─── Actualizar cantidad ──────────────────────────────────────────────────────

  async updateItem(key: string, ttl: number, variantId: string, dto: UpdateCartItemDto): Promise<Cart> {
    const existingRaw = await this.redis.hget(key, variantId);
    if (!existingRaw) throw new NotFoundException('Ítem no encontrado en el carrito');

    if (dto.quantity === 0) {
      return this.removeItem(key, variantId);
    }

    const item: CartItem = JSON.parse(existingRaw);
    item.quantity = dto.quantity;
    await this.redis.hset(key, variantId, JSON.stringify(item));
    await this.redis.expire(key, ttl);
    return this.getCart(key);
  }

  async updateItemAnon(sessionId: string, variantId: string, dto: UpdateCartItemDto): Promise<Cart> {
    return this.updateItem(this.anonKey(sessionId), ANON_CART_TTL, variantId, dto);
  }

  async updateItemUser(userId: string, variantId: string, dto: UpdateCartItemDto): Promise<Cart> {
    return this.updateItem(this.userKey(userId), AUTH_CART_TTL, variantId, dto);
  }

  // ─── Eliminar ítem ────────────────────────────────────────────────────────────

  async removeItem(key: string, variantId: string): Promise<Cart> {
    await this.redis.hdel(key, variantId);
    return this.getCart(key);
  }

  async removeItemAnon(sessionId: string, variantId: string): Promise<Cart> {
    return this.removeItem(this.anonKey(sessionId), variantId);
  }

  async removeItemUser(userId: string, variantId: string): Promise<Cart> {
    return this.removeItem(this.userKey(userId), variantId);
  }

  // ─── Limpiar carrito ──────────────────────────────────────────────────────────

  async clearCart(key: string): Promise<void> {
    await this.redis.del(key);
  }

  // ─── MERGE post-login ─────────────────────────────────────────────────────────
  // Cuando el usuario se autentica, fusiona el carrito anónimo con el suyo.
  // Regla: si el mismo producto está en ambos, se suman las cantidades.

  async mergeAnonIntoUser(sessionId: string, userId: string): Promise<Cart> {
    const anonKey = this.anonKey(sessionId);
    const userKey = this.userKey(userId);

    const anonRaw = await this.redis.hgetall(anonKey);
    if (!anonRaw || Object.keys(anonRaw).length === 0) {
      return this.getUserCart(userId);
    }

    for (const [variantId, rawItem] of Object.entries(anonRaw)) {
      const anonItem: CartItem = JSON.parse(rawItem);
      const existingRaw = await this.redis.hget(userKey, variantId);

      if (existingRaw) {
        const userItem: CartItem = JSON.parse(existingRaw);
        userItem.quantity += anonItem.quantity;
        await this.redis.hset(userKey, variantId, JSON.stringify(userItem));
      } else {
        await this.redis.hset(userKey, variantId, rawItem);
      }
    }

    await this.redis.expire(userKey, AUTH_CART_TTL);
    await this.clearCart(anonKey); // eliminar carrito anónimo
    return this.getUserCart(userId);
  }

  // ─── Helper: calcular totales ─────────────────────────────────────────────────

  private buildCartResponse(items: CartItem[]): Cart {
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    return { items, total: Math.round(total * 100) / 100, itemCount };
  }
}
