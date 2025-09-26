/* eslint-disable prettier/prettier */
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum PeriodPreset {
  TODAY = 'today',
  D7 = '7d',
  D30 = '30d',
}

export class PlanUsageQueryDto {
  @IsOptional() @IsEnum(PeriodPreset)
  period?: PeriodPreset;

  /** YYYY-MM-DD */
  @IsOptional() @IsString()
  from?: string;

  /** YYYY-MM-DD */
  @IsOptional() @IsString()
  to?: string;

  /** لتصنيف الاستهلاك المنخفض (0..1) */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(1)
  lowThreshold?: number;

  /** لتصنيف الاستهلاك العالي (0..1) */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(1)
  highThreshold?: number;

  /** ترقيم الصفحات */
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  pageSize?: number;
}
