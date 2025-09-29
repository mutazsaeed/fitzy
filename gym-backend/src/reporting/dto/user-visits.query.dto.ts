/* eslint-disable prettier/prettier */
import { IsInt, IsOptional, Matches, Min, IsIn } from 'class-validator';

export class UserVisitsQueryDto {
  // اختياري: فلترة مباشرة بمدى تواريخ
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string; // YYYY-MM-DD

  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;   // YYYY-MM-DD

  // اختياري: بدل from/to يمكنك تمرير فترة مختصرة (القيمة الافتراضية 30d)
  @IsOptional() @IsIn(['today', '7d', '30d'])
  period?: 'today' | '7d' | '30d';

  // ترقيم الصفحات
  @IsOptional() @IsInt() @Min(1)
  page: number = 1;

  @IsOptional() @IsInt() @Min(1)
  pageSize: number = 20;
}
