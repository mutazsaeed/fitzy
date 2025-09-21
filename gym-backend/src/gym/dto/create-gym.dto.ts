/* eslint-disable prettier/prettier */
import { IsString, IsOptional, IsArray, IsNumber, IsObject } from 'class-validator';

export class CreateGymDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  logo?: string; // رابط الشعار

  @IsOptional()
  @IsArray()
  images?: string[]; // روابط الصور

  @IsString()
  gender: string; // male / female

  @IsString()
  category: string; // basic / gold / elite

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsObject()
  workingHours?: Record<string, string>; // نخزنها كـ JSON (مثال: { "mon": "9-5", "tue": "9-5" })

  @IsOptional()
  @IsArray()
  services?: string[]; // الخدمات (مسبح، كارديو...)

  @IsOptional()
  @IsNumber()
  visitPrice?: number; // السعر الداخلي للزيارة
}
