/* eslint-disable prettier/prettier */
export interface UserVisitItem {
  visitId: number;
  visitDate: string;   // YYYY-MM-DD
  checkedInAt: string | null; // ISO
  gymId: number;
  gymName: string;
  branchId: number | null;
  branchName: string | null;
}

export interface UserVisitsResponseDto {
  range: { from: string; to: string; timezone: 'Asia/Riyadh' };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  items: UserVisitItem[];
}
