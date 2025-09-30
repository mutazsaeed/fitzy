/* eslint-disable prettier/prettier */

export class UserSubscriptionRemainingResponseDto {
  /** المعرّف الداخلي لاشتراك المستخدم الحالي */
  subscriptionId!: number;

  /** نوع الخطة (Basic/Standard/ Premium) */
  plan!: 'BASIC' | 'STANDARD' | 'PREMIUM';

  /** نطاق الفترة المحسوبة بالتوقيت المحلي Asia/Riyadh */
  period!: {
    from: string;         // YYYY-MM-DD (start-of-day)
    toExclusive: string;  // YYYY-MM-DD (اليوم التالي start-of-day)
    timezone: 'Asia/Riyadh';
  };

  /** استخدام الزيارات خلال الفترة */
  usage!: {
    totalVisits: number;      // الحد المسموح به في الاشتراك الحالي
    usedVisits: number;       // عدد الزيارات المحتسبة حتى asOf
    remainingVisits: number;  // = totalVisits - usedVisits (لا تقل عن 0)
  };

  /** الأيام داخل فترة الاشتراك بالنسبة لتاريخ asOf */
  days!: {
    total: number;        // إجمالي أيام الفترة
    passed: number;       // أيام مضت حتى asOf
    remaining: number;    // = total - passed (لا تقل عن 0)
  };

  /** مؤشر قرب الانتهاء حسب العتبات (سنحسبه لاحقاً في الخدمة) */
  nearExpiry!: boolean;
}
