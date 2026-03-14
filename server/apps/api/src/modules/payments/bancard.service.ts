import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class BancardService {
  private readonly logger = new Logger(BancardService.name);
  private readonly privateKey: string;
  private readonly publicKey: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.privateKey = config.get<string>('BANCARD_PRIVATE_KEY', '');
    this.publicKey = config.get<string>('BANCARD_PUBLIC_KEY', '');
    this.baseUrl = config.get<string>(
      'BANCARD_BASE_URL',
      'https://vpos.infonet.com.py',
    );
  }

  // ─── Generar token HMAC-SHA256 para single_buy ────────────────────────────────
  // Token = MD5(privateKey + shopProcessId + amount + currency)
  // Según documentación Bancard VPOS2

  generateToken(shopProcessId: string, amount: string, currency = 'PYG'): string {
    const rawString = `${this.privateKey}${shopProcessId}${amount}${currency}`;
    return crypto.createHash('md5').update(rawString).digest('hex');
  }

  // ─── Generar token para confirmación / webhook ────────────────────────────────

  generateConfirmToken(shopProcessId: string): string {
    const rawString = `${this.privateKey}${shopProcessId}confirm`;
    return crypto.createHash('md5').update(rawString).digest('hex');
  }

  // ─── Validar firma del webhook ────────────────────────────────────────────────
  // Se verifica ANTES de cualquier cambio de estado

  validateWebhookToken(shopProcessId: string, amount: string, receivedToken: string): boolean {
    const expectedToken = this.generateToken(shopProcessId, amount);
    return crypto.timingSafeEqual(
      Buffer.from(expectedToken, 'utf-8'),
      Buffer.from(receivedToken, 'utf-8'),
    );
  }

  // ─── Iniciar pago single_buy ──────────────────────────────────────────────────

  async initiateSingleBuy(params: {
    shopProcessId: string;
    amount: string;
    currency: string;
    description: string;
    returnUrl: string;
    cancelUrl: string;
  }): Promise<{ processId: string; redirectUrl: string }> {
    const { shopProcessId, amount, currency, description, returnUrl, cancelUrl } = params;
    const token = this.generateToken(shopProcessId, amount, currency);

    const endpoint =
      this.config.get('BANCARD_ENV') === 'production'
        ? `${this.baseUrl}/vpos/api/0.3/single_buy`
        : `${this.baseUrl}/vpos/api/0.3/single_buy`;

    const body = {
      public_key: this.publicKey,
      operation: {
        token,
        shop_process_id: shopProcessId,
        amount,
        currency,
        additional_data: '',
        description,
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json() as any;

    if (data.status !== 'success') {
      throw new Error(`Bancard error: ${data.messages?.[0]?.dsc || 'Unknown error'}`);
    }

    const processId = data.process_id;
    const redirectUrl = `${this.baseUrl}/payment/index?process_id=${processId}`;

    return { processId, redirectUrl };
  }

  // ─── Reversa ──────────────────────────────────────────────────────────────────

  async rollback(shopProcessId: string): Promise<void> {
    const token = this.generateConfirmToken(shopProcessId);
    const endpoint = `${this.baseUrl}/vpos/api/0.3/single_buy/rollback`;

    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        public_key: this.publicKey,
        operation: { token, shop_process_id: shopProcessId },
      }),
    });
  }
}
