/* eslint-disable prettier/prettier */
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum PeriodPreset {
  TODAY = 'today',
  D7 = '7d',
  D30 = '30d',
}

/** طلب الخريطة الحرارية بالساعات */
export class GymHourlyHeatmapQueryDto {
  @Type(() => Number) @IsInt() @Min(1)
  gymId!: number; // إلزامي

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  branchId?: number; // اختياري

  @IsOptional() @IsEnum(PeriodPreset)
  period?: PeriodPreset; // today | 7d | 30d

  /** YYYY-MM-DD */
  @IsOptional() @IsString()
  from?: string;

  /** YYYY-MM-DD */
  @IsOptional() @IsString()
  to?: string;
}

/** عنصر في الخريطة الحرارية: يوم الأسبوع × الساعة */
export type HourlyCell = {
  /** 0..6 (Sun..Sat) مع اعتبار التوقيت Asia/Riyadh */
  dow: number;
  /** 0..23 */
  hour: number;
  /** عدد الزيارات */
  visits: number;
};

/** ساعات/أيام الذروة */
export type PeakInfo = {
  /** أعلى الساعات داخل الفترة */
  topHours: { hour: number; visits: number }[];
  /** أعلى أيام الأسبوع داخل الفترة */
  topDays: { dow: number; visits: number }[];
};

/** استجابة الخريطة الحرارية */
export type GymHourlyHeatmapResponseDto = {
  range: { from: string; to: string; timezone: 'Asia/Riyadh' };
  params: { gymId: number; branchId?: number | null };
  heatmap: HourlyCell[];
  peak: PeakInfo;
};
