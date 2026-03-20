import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import {
  CreateProductDto, UpdateProductDto,
  CreateCategoryDto, UpdateCategoryDto,
  ProductQueryDto, CreateVariantDto, UpdateVariantDto,
  CreateProductImageDto,
} from './dto/catalog.dto';
import { JwtAuthGuard, Roles, RolesGuard } from '@libs/common';
import { Role } from '@prisma/client';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ─── Categorías (público) ────────────────────────────────────────────────────
  @Get('categories')
  getCategories() {
    return this.catalogService.getCategories();
  }

  @Get('categories/featured')
  getFeaturedCategories() {
    return this.catalogService.getFeaturedCategories();
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(dto);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.catalogService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  deleteCategory(@Param('id') id: string) {
    return this.catalogService.deleteCategory(id);
  }

  // ─── Productos (listado y detalle son públicos) ───────────────────────────────
  @Get('products')
  getProducts(@Query() query: ProductQueryDto) {
    return this.catalogService.getProducts(query);
  }
  // IMPORTANT: must be declared BEFORE products/:slug to avoid 'id' matching the slug param
  @Get('products/id/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getProductById(@Param('id') id: string) {
    return this.catalogService.getProductById(id);
  }
  @Get('products/:slug')
  getProductBySlug(@Param('slug') slug: string) {
    return this.catalogService.getProductBySlug(slug);
  }

  @Post('products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createProduct(@Body() dto: CreateProductDto) {
    return this.catalogService.createProduct(dto);
  }

  @Patch('products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.catalogService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  deleteProduct(@Param('id') id: string) {
    return this.catalogService.deleteProduct(id);
  }

  // ─── Imágenes ─────────────────────────────────────────────────────────────────
  @Post('products/:id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  addProductImage(@Param('id') productId: string, @Body() dto: CreateProductImageDto) {
    return this.catalogService.addProductImage(productId, dto);
  }

  @Delete('products/:id/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  deleteProductImage(@Param('id') productId: string, @Param('imageId') imageId: string) {
    return this.catalogService.deleteProductImage(productId, imageId);
  }

  // ─── Variantes ────────────────────────────────────────────────────────────────
  @Post('products/:id/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  addVariant(@Param('id') productId: string, @Body() dto: CreateVariantDto) {
    return this.catalogService.addVariant(productId, dto);
  }

  @Patch('products/:id/variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateVariant(
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.catalogService.updateVariant(productId, variantId, dto);
  }

  @Delete('products/:id/variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  removeVariant(@Param('id') productId: string, @Param('variantId') variantId: string) {
    return this.catalogService.removeVariant(productId, variantId);
  }}
