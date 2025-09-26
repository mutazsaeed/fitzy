/* eslint-disable prettier/prettier */

export type GymDuesSortBy = 'visits' | 'dues';
export type SortOrder = 'asc' | 'desc';

/**
 * Query DTO لتقرير مستحقات الأندية.
 * يدعم:
 * - period: today | 7d | 30d
 * - أو from/to بصيغة YYYY-MM-DD
 * - sortBy: visits | dues
 * - order: asc | desc
 * - pagination: page / pageSize
 */
export class GymDuesQueryDto {
  period?: 'today' | '7d' | '30d';
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD

  sortBy?: GymDuesSortBy; // default: 'dues'
  order?: SortOrder;      // default: 'desc'

  page?: number;     // default: 1
  pageSize?: number; // default: 10 (1..100)
}
