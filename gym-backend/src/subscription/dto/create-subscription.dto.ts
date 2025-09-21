import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  name: string;

  @IsString()
  gender: string; // male / female

  @IsString()
  level: string; // basic / standard / premium

  @IsNumber()
  price: number;

  @IsNumber()
  duration: number; // مدة الاشتراك بالأشهر

  @IsOptional()
  @IsString()
  promoImage?: string;
}
