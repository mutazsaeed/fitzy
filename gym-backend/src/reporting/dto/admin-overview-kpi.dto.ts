// DTOs for Admin/Owner overview dashboard

export type AdminOverviewPoint = {
  date: string; // YYYY-MM-DD
  visits: number;
};

export class AdminOverviewKpiDto {
  // الفترة المطلوبة (إما today/7d/30d تُحوَّل إلى from/to أو from/to مباشر)
  period!: { from: string; to: string };

  // مؤشرات عليا
  totalVisits!: number;

  // placeholders حتى نضيف نموذج العضوية/الشراء (UserSubscription / Membership)
  activeSubscriptions!: number; // سيُحتسب لاحقًا بعد إضافة نموذج العضوية
  totalRevenue!: number; // سيُحتسب لاحقًا من عمليات الشراء/التجديد

  // تجميع زمني يومي للزيارات
  timeseries!: AdminOverviewPoint[];
}
