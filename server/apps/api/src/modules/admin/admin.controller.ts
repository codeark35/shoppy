import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Role, OrderStatus } from '@prisma/client';
import { AdminService } from './admin.service';
import { JwtAuthGuard, RolesGuard, Roles } from '@libs/common';
import { UpdateStockDto, AdminOrderQueryDto } from './dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────────
  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  // ─── Órdenes ──────────────────────────────────────────────────────────────────
  @Get('orders')
  @Roles(Role.ADMIN, Role.WAREHOUSE)
  getOrders(@Query() query: AdminOrderQueryDto) {
    return this.adminService.getOrders(query);
  }

  @Patch('orders/:id/status')
  @Roles(Role.ADMIN, Role.WAREHOUSE)
  @HttpCode(HttpStatus.OK)
  updateOrderStatus(
    @Param('id') orderId: string,
    @Body() body: { status: OrderStatus; trackingNumber?: string },
  ) {
    return this.adminService.updateOrderStatus(orderId, body.status, body.trackingNumber);
  }

  // ─── Stock ────────────────────────────────────────────────────────────────────
  @Get('inventory')
  @Roles(Role.ADMIN, Role.WAREHOUSE)
  getInventory(
    @Query('lowStock') lowStock?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getInventory(
      lowStock === 'true',
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Patch('inventory/variants/:variantId/stock')
  @Roles(Role.ADMIN, Role.WAREHOUSE)
  @HttpCode(HttpStatus.OK)
  updateStock(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.adminService.updateStock(variantId, dto.stock);
  }

  // ─── Usuarios ─────────────────────────────────────────────────────────────────
  @Get('users')
  getUsers(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.adminService.getUsers(Number(page), Number(limit));
  }

  @Patch('users/:id/role')
  @HttpCode(HttpStatus.OK)
  updateUserRole(
    @Param('id') userId: string,
    @Body() body: { role: Role },
  ) {
    return this.adminService.updateUserRole(userId, body.role);
  }
}
