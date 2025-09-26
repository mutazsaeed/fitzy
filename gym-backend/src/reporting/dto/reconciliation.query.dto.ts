/* eslint-disable prettier/prettier */
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum RecoSortBy {
  GYM_NAME = 'gymName',
  VISITS = 'visits',
  DUES = 'dues',
}

export enum RecoOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * كشف مطابقة شهري:
 * - month: بصيغة YYYY-MM (مفضل)
 * - أو from/to: YYYY-MM-DD (في حال أردت مدى مخصص)
 * - فرز + ترقيم صفحات
 */
export class ReconciliationQueryDto {
  /** مثال: 2025-09 */
  @IsOptional() @IsString()
  month?: string;

  /** YYYY-MM-DD */
  @IsOptional() @IsString()
  from?: string;

  /** YYYY-MM-DD */
  @IsOptional() @IsString()
  to?: string;

  @IsOptional() @IsEnum(RecoSortBy)
  sortBy?: RecoSortBy = RecoSortBy.DUES;

  @IsOptional() @IsEnum(RecoOrder)
  order?: RecoOrder = RecoOrder.DESC;

  @IsOptional() @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @IsInt() @Min(1) @Max(100)
  pageSize?: number = 20;
}
