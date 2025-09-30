import { IsOptional, IsInt, Min, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';

export class UserSubscriptionRemainingQueryDto {
  /**
   * تاريخ مرجعي للحساب بصيغة ISO (YYYY-MM-DD). إن لم يرسل: نستخدم تاريخ اليوم (بتوقيت Asia/Riyadh).
   * سنحوّله لاحقاً إلى start-of-day في Asia/Riyadh.
   */
  @IsOptional()
  @IsISO8601({ strict: true })
  asOf?: string;

  /** عتبة تنبيه الزيارات المتبقية (مثلاً <= 3) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  visitThreshold?: number;

  /** عتبة تنبيه الأيام المتبقية (مثلاً <= 5 أيام) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  daysThreshold?: number;
}
