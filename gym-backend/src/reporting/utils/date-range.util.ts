/* eslint-disable prettier/prettier */
// cspell:disable
import { BadRequestException } from '@nestjs/common';

export type Period = 'today' | '7d' | '30d';

export interface ResolvedPeriod {
  fromStart: Date;     // بداية اليوم (00:00) للتاريخ الأول
  toStart: Date;       // بداية اليوم (00:00) للتاريخ الأخير (مشمول)
  toExclusive: Date;   // اليوم التالي لبداية اليوم الأخير (غير مشمول)
  fromStr: string;     // YYYY-MM-DD
  toStr: string;       // YYYY-MM-DD
}

export interface ResolvedRecoRange extends ResolvedPeriod {
  /** مثل: '202509' لاستخدامها في رقم الفاتورة */
  invoiceMonthTag: string;
}

/**
 * أدوات مساعدة موحّدة لنطاقات التواريخ.
 * ملاحظة: جميع الحسابات تعتمد على تاريخ/وقت الخادم المحلي (لا تحويل مناطق زمنية هنا).
 */
export class DateRangeUtil {
  /** YYYY-MM-DD -> Date(yyyy, mm-1, dd, 00:00:00.000). يتحقق من الصيغة والقيمة. */
  static parseYmdToLocalStart(ymd: string): Date {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    if (!m) throw new BadRequestException('Invalid date format, expected YYYY-MM-DD');
    const [, y, mo, d] = m;
    const dt = new Date(Number(y), Number(mo) - 1, Number(d), 0, 0, 0, 0);
    if (isNaN(dt.getTime())) throw new BadRequestException('Invalid date value');
    return dt;
  }

  /** Date -> 'YYYY-MM-DD' */
  static toYmd(d: Date): string {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /** يحل نطاق فترة جاهز للاستعلامات اليومية (visitDate بين gte/lt) */
  static resolvePeriod(input: {
    period?: Period;
    from?: string; // YYYY-MM-DD
    to?: string;   // YYYY-MM-DD
  }): ResolvedPeriod {
    let fromStart: Date;
    let toStart: Date;

    if (input.from && input.to) {
      fromStart = this.parseYmdToLocalStart(input.from);
      toStart = this.parseYmdToLocalStart(input.to);
      if (fromStart > toStart) throw new BadRequestException('from must be <= to');
    } else {
      const p = input.period ?? '30d';
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      switch (p) {
        case 'today':
          toStart = new Date(today);
          fromStart = new Date(today);
          break;
        case '7d':
          toStart = new Date(today);
          fromStart = new Date(today);
          fromStart.setDate(fromStart.getDate() - 6);
          break;
        case '30d':
        default:
          toStart = new Date(today);
          fromStart = new Date(today);
          fromStart.setDate(fromStart.getDate() - 29);
          break;
      }
    }

    const toExclusive = new Date(toStart);
    toExclusive.setDate(toExclusive.getDate() + 1);

    return {
      fromStart,
      toStart,
      toExclusive,
      fromStr: this.toYmd(fromStart),
      toStr: this.toYmd(toStart),
    };
  }

  /** يحل نطاق المصالحة الشهرية إما بـ month=YYYY-MM أو from/to */
  static resolveRecoRange(q: {
    month?: string; // YYYY-MM
    from?: string;  // YYYY-MM-DD
    to?: string;    // YYYY-MM-DD
  }): ResolvedRecoRange {
    let fromStart: Date;
    let toStart: Date;

    if (q.month) {
      const m = /^(\d{4})-(\d{2})$/.exec(q.month);
      if (!m) throw new BadRequestException('month must be YYYY-MM');
      const [, y, mo] = m;
      fromStart = new Date(Number(y), Number(mo) - 1, 1, 0, 0, 0, 0);
      toStart = new Date(fromStart);
      // آخر يوم في الشهر: نتحرك للشهر القادم ثم نرجع يوم
      toStart.setMonth(toStart.getMonth() + 1);
      toStart.setDate(toStart.getDate() - 1);
    } else if (q.from && q.to) {
      fromStart = this.parseYmdToLocalStart(q.from);
      toStart = this.parseYmdToLocalStart(q.to);
      if (fromStart > toStart) throw new BadRequestException('from must be <= to');
    } else {
      // افتراضي الشهر الحالي
      const now = new Date();
      fromStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      toStart = new Date(fromStart);
      toStart.setMonth(toStart.getMonth() + 1);
      toStart.setDate(toStart.getDate() - 1);
    }

    const toExclusive = new Date(toStart);
    toExclusive.setDate(toExclusive.getDate() + 1);

    const invoiceMonthTag = `${toStart.getFullYear()}${`${toStart.getMonth() + 1}`.padStart(2, '0')}`;

    return {
      fromStart,
      toStart,
      toExclusive,
      fromStr: this.toYmd(fromStart),
      toStr: this.toYmd(toStart),
      invoiceMonthTag,
    };
  }
}
