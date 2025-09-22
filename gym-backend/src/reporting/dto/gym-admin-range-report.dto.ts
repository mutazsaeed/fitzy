export interface DailyBreakdownItem {
  /** YYYY-MM-DD (local day) */
  date: string;
  visits: number;
}

export interface GymAdminRangeReportDto {
  totalVisits: number;
  uniqueUsers: number;
  dailyBreakdown: DailyBreakdownItem[];
}
