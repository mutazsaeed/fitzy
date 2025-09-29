/* eslint-disable prettier/prettier */
// cspell:disable
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserVisitsQueryDto } from '../dto/user-visits.query.dto';
import { UserVisitsResponseDto } from '../dto/user-visits.response.dto';

@Injectable()
export class UserReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------
  // Local helpers (سيُنقل لاحقاً إلى DateRangeUtil)
  // ---------------------------
  private parseYmdToLocalStart(ymd: string): Date {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    if (!m) throw new BadRequestException('Invalid date format, expected YYYY-MM-DD');
    const [, y, mo, d] = m;
    const dt = new Date(Number(y), Number(mo) - 1, Number(d), 0, 0, 0, 0);
    if (isNaN(dt.getTime())) throw new BadRequestException('Invalid date value');
    return dt;
  }

  private toYmd(d: Date): string {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // ---------------------------
  // Public API
  // ---------------------------
  /**
   * تقارير زيارات المستخدم (My Visits)
   * نفس منطق ReportingService.getMyVisits لكن معزول هنا
   * دون أي تأثير على الخدمات/الكونترولرز الحالية.
   */
  async getMyVisits(userId: number, q: UserVisitsQueryDto): Promise<UserVisitsResponseDto> {
    // resolve range (افتراضي 30 يوم)
    const fromStart = q.from
      ? this.parseYmdToLocalStart(q.from)
      : (() => {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() - 29);
          return d;
        })();

    const toStart = q.to
      ? this.parseYmdToLocalStart(q.to)
      : (() => {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          return d;
        })();

    if (fromStart > toStart) throw new BadRequestException('from must be <= to');

    const toExclusive = new Date(toStart);
    toExclusive.setDate(toExclusive.getDate() + 1);

    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.max(1, Math.min(100, Number(q.pageSize ?? 20)));

    // إجمالي
    const total = await this.prisma.visit.count({
      where: { userId, visitDate: { gte: fromStart, lt: toExclusive } },
    });

    // عناصر الصفحة (أحدث أولاً)
    const rows = await this.prisma.visit.findMany({
      where: { userId, visitDate: { gte: fromStart, lt: toExclusive } },
      orderBy: [{ visitDate: 'desc' }, { id: 'desc' }],
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true,
        visitDate: true,
        checkedInAt: true,
        gymId: true,
        branchId: true,
        gym: { select: { name: true } },
        branch: { select: { name: true } },
      },
    });

    const items = rows.map((r) => ({
      visitId: r.id,
      visitDate: this.toYmd(new Date(r.visitDate)),
      checkedInAt: r.checkedInAt ? new Date(r.checkedInAt).toISOString() : null,
      gymId: r.gymId,
      gymName: r.gym?.name ?? `Gym#${r.gymId}`,
      branchId: r.branchId ?? null,
      branchName: r.branch?.name ?? null,
    }));

    const totalPages = Math.ceil(total / pageSize);

    return {
      range: { from: this.toYmd(fromStart), to: this.toYmd(toStart), timezone: 'Asia/Riyadh' },
      pagination: { page, pageSize, total, totalPages },
      items,
    };
  }
}
