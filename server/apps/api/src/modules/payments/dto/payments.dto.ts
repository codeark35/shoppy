import { IsString } from 'class-validator';

export class InitiatePaymentDto {
  @IsString()
  orderId: string;
}

// Estructura del webhook Bancard (simplificada — validar firma antes de deserializar)
export interface BancardWebhookPayload {
  operation: {
    token: string;
    shop_process_id: string;
    response: 'S' | 'N'; // S = success, N = failure
    response_code: string;
    response_description: string;
    amount: string;
    currency: string;
    authorization_number?: string;
    ticket_number?: string;
    response_details?: string;
    extended_response_description?: string;
    security_information?: {
      customer_ip: string;
      card_source: string;
      card_country: string;
      version: string;
      risk_index: string;
    };
  };
}
