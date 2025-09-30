/* eslint-disable prettier/prettier */
// cspell:disable
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserVisitsQueryDto } from '../dto/user-visits.query.dto';
import { UserVisitsResponseDto } from '../dto/user-visits.response.dto';
import { UserSubscriptionRemainingQueryDto } from '../dto/user-subscription-remaining.query.dto';
import { UserSubscriptionRemainingResponseDto } from '../dto/user-subscription-remaining.response.dto';

type Plan = 'BASIC' | 'STANDARD' | 'PREMIUM';

@Injectable()
export class UserReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly TZ = 'Asia/Riyadh' as const;

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

  private addDays(d: Date, days: number): Date {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
  }

  private clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
  }

  private diffDaysUTC(a: Date, b: Date): number {
    const MS = 24 * 60 * 60 * 1000;
    return Math.floor((b.getTime() - a.getTime()) / MS);
  }

  async getMyVisits(userId: number, q: UserVisitsQueryDto): Promise<UserVisitsResponseDto> {
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

    const toExclusive = this.addDays(toStart, 1);

    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.max(1, Math.min(100, Number(q.pageSize ?? 20)));

    const total = await this.prisma.visit.count({
      where: { userId, visitDate: { gte: fromStart, lt: toExclusive } },
    });

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
      range: { from: this.toYmd(fromStart), to: this.toYmd(toStart), timezone: this.TZ },
      pagination: { page, pageSize, total, totalPages },
      items,
    };
  }

  async getMySubscriptionRemaining(
    userId: number,
    q: UserSubscriptionRemainingQueryDto,
  ): Promise<UserSubscriptionRemainingResponseDto> {
    const asOfStart = q.asOf
      ? this.parseYmdToLocalStart(q.asOf)
      : (() => {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          return d;
        })();

    const sub = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        startDate: { lte: asOfStart },
        endDate: { gt: asOfStart },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        visitLimit: true,
        subscription: { select: { level: true } },
      },
    });

    if (!sub) {
      throw new NotFoundException('No active subscription found for the selected date');
    }

    const periodFrom = new Date(sub.startDate);
    periodFrom.setHours(0, 0, 0, 0);

    const periodToExclusive = new Date(sub.endDate);

    const asOfEndExclusive = this.addDays(asOfStart, 1);
    const visitsUpperBound =
      asOfEndExclusive < periodToExclusive ? asOfEndExclusive : periodToExclusive;

    const usedVisits = await this.prisma.visit.count({
      where: {
        userId,
        visitDate: { gte: periodFrom, lt: visitsUpperBound },
      },
    });

    const totalVisits = Number(sub.visitLimit ?? 0);
    const remainingVisits = Math.max(0, totalVisits - usedVisits);

    const totalDays = this.diffDaysUTC(periodFrom, periodToExclusive);
    const passedDaysRaw = this.diffDaysUTC(periodFrom, asOfEndExclusive);
    const passedDays = this.clamp(passedDaysRaw, 0, Math.max(0, totalDays));
    const remainingDays = Math.max(0, totalDays - passedDays);

    const visitThreshold = Number.isInteger(q.visitThreshold) ? Number(q.visitThreshold) : 3;
    const daysThreshold = Number.isInteger(q.daysThreshold) ? Number(q.daysThreshold) : 5;

    const nearExpiry =
      (totalVisits > 0 && remainingVisits <= visitThreshold) || remainingDays <= daysThreshold;

    const planRaw = (sub.subscription?.level ?? 'BASIC').toString().toUpperCase();
    const plan: Plan = (['BASIC', 'STANDARD', 'PREMIUM'].includes(planRaw)
      ? planRaw
      : 'BASIC') as Plan;

    return {
      subscriptionId: sub.id,
      plan,
      period: {
        from: this.toYmd(periodFrom),
        toExclusive: this.toYmd(periodToExclusive),
        timezone: this.TZ,
      },
      usage: {
        totalVisits,
        usedVisits,
        remainingVisits,
      },
      days: {
        total: totalDays,
        passed: passedDays,
        remaining: remainingDays,
      },
      nearExpiry,
    };
  }
}
