/* eslint-disable prettier/prettier */
export type TopGymsItem = {
  gymId: string;
  gymName: string;
  visits: number;
  revenue: number; // visits * visitPrice
};

export type TopGymsResponse = {
  range: { from: string; to: string; timezone: 'Asia/Riyadh' };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  sort: { by: 'visits' | 'revenue'; order: 'asc' | 'desc' };
  items: TopGymsItem[];
};
