/* eslint-disable prettier/prettier */
export type ReconciliationItemDto = {
  gymId: number;
  gymName: string;
  visitPrice: number | null;
  visits: number;          // عدد الزيارات خلال الفترة
  dues: number;            // visits * visitPrice (0 إذا null)
  invoiceNumber: string;   // مثال: INV-202509-<gymId>
};

export type ReconciliationResponseDto = {
  range: { from: string; to: string; timezone: 'Asia/Riyadh' };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  sort: { by: 'gymName' | 'visits' | 'dues'; order: 'asc' | 'desc' };
  items: ReconciliationItemDto[];
  totals: { totalVisits: number; totalDues: number };
};
