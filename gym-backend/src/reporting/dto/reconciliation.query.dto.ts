/* eslint-disable prettier/prettier */
import { IsEnum, IsInt, IsOptional, IsString, Max, Min, Matches } from 'class-validator';

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
 * - month: بصيغة YYYY-MM
 * - أو from/to: YYYY-MM-DD
 * - مع فرز وترقيم صفحات
 */
export class ReconciliationQueryDto {
  /** مثال: 2025-09 */
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be YYYY-MM' })
  month?: string;

  /** YYYY-MM-DD */
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from must be YYYY-MM-DD' })
  from?: string;

  /** YYYY-MM-DD */
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to must be YYYY-MM-DD' })
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
