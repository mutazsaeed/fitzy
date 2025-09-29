/* eslint-disable prettier/prettier */
import { RecoOrder, RecoSortBy } from './reconciliation.query.dto';

export type ReconciliationItemDto = {
  gymId: number;
  gymName: string;
  visitPrice: number | null;
  visits: number;          // عدد الزيارات خلال الفترة
  dues: number;            // visits * (visitPrice ?? 0)
  invoiceNumber: string;   // مثال: INV-202509-<gymId>
};

export type ReconciliationResponseDto = {
  range: { from: string; to: string; timezone: 'Asia/Riyadh' };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  sort: { by: RecoSortBy; order: RecoOrder };
  items: ReconciliationItemDto[];
  totals: { totalVisits: number; totalDues: number };
};
