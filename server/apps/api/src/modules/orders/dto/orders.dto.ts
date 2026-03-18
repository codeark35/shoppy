import {
  IsString, IsOptional, IsArray,
  ValidateNested, IsObject, IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ShippingAddressDto {
  @IsString()
  addressLabel: string;

  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  department: string;

  @IsString()
  recipientName: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;
}

export class CreateOrderDto {
  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  shippingRateId?: string;

  @IsOptional()
  @IsIn(['AUTO_FIRST', 'COUPON_FIRST', 'BEST_PRICE'])
  promotionStrategy?: 'AUTO_FIRST' | 'COUPON_FIRST' | 'BEST_PRICE';
}

export class UpdateOrderStatusDto {
  @IsString()
  status: string;
}
