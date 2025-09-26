/* eslint-disable prettier/prettier */
export type PlanKey = 'BASIC' | 'STANDARD' | 'PREMIUM' | 'UNKNOWN';

export type PlanUsageUserItem = {
  userId: number;
  name?: string;
  email?: string;
  plan: PlanKey;
  visitsUsed: number;
  visitLimit: number;
  usageRatio: number; // 0..1
  bucket: 'low' | 'normal' | 'high';
};

export type PlanUsageAggregate = {
  plan: PlanKey;
  subscribers: number;
  avgUsage: number;   // 0..1
  medianUsage: number;// 0..1
  lowCount: number;
  highCount: number;
};

export type PlanUsageResponseDto = {
  range: { from: string; to: string; timezone?: string };
  thresholds: { low: number; high: number };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  perPlan: PlanUsageAggregate[];
  items: PlanUsageUserItem[];
};
