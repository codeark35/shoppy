import {
  Controller, Post, Get, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto, BancardWebhookPayload } from './dto/payments.dto';
import { JwtAuthGuard, CurrentUser } from '@libs/common';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // POST /payments/initiate — iniciar pago Bancard (requiere auth)
  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  initiate(
    @CurrentUser('id') userId: string,
    @Body() dto: InitiatePaymentDto,
  ) {
    return this.paymentsService.initiatePayment(userId, dto);
  }

  // POST /payments/webhook — recibir notificación de Bancard (sin auth, valida HMAC)
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(@Body() payload: BancardWebhookPayload) {
    return this.paymentsService.handleWebhook(payload);
  }

  // GET /payments/order/:orderId — consultar estado de pago
  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  getByOrder(
    @Param('orderId') orderId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.getPaymentByOrder(orderId, userId);
  }
}
