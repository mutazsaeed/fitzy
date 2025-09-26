/* eslint-disable prettier/prettier */
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum PeriodPreset {
  TODAY = 'today',
  D7 = '7d',
  D30 = '30d',
}

/** طلب السلسلة اليومية للفروع */
export class GymBranchDailyQueryDto {
  @Type(() => Number) @IsInt() @Min(1)
  gymId!: number; // إلزامي

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  branchId?: number; // اختياري: إن لم يُرسل نرجع كل الفروع

  @IsOptional() @IsEnum(PeriodPreset)
  period?: PeriodPreset; // today | 7d | 30d

  /** YYYY-MM-DD */
  @IsOptional() @IsString()
  from?: string;

  /** YYYY-MM-DD */
  @IsOptional() @IsString()
  to?: string;
}

/** نقطة يومية */
export type BranchDailyPoint = {
  /** YYYY-MM-DD */
  date: string;
  visits: number;
};

/** سلسلة فرع */
export type BranchDailySeries = {
  branchId: number;
  branchName: string;
  points: BranchDailyPoint[];
};

/** الاستجابة */
export type GymBranchDailyResponseDto = {
  range: { from: string; to: string; timezone: 'Asia/Riyadh' };
  series: BranchDailySeries[];
  totals: { visits: number; uniqueUsers: number };
};
