/* eslint-disable prettier/prettier */

export class GymDuesItemDto {
  gymId: number;
  gymName: string;
  visitPrice: number | null; // سعر الزيارة على مستوى النادي
  visits: number;            // عدد الزيارات في المدى
  dues: number;              // visits * visitPrice (0 إذا null)
}

export class GymDuesResponseDto {
  range: { from: string; to: string; timezone?: string };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  sort: { by: 'visits' | 'dues'; order: 'asc' | 'desc' };
  items: GymDuesItemDto[];
  totals: { totalVisits: number; totalDues: number };
}
