/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
// cspell:disable
import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { AdminOverviewKpiDto } from '../dto/admin-overview-kpi.dto';

// Top Gyms
import {
  TopGymsQueryDto,
  TopGymsSortBy,
  SortOrder,
} from '../dto/top-gyms.query.dto';
import { TopGymsResponse } from '../dto/top-gyms.response.dto';

// Plan Usage
import { PlanUsageQueryDto } from '../dto/plan-usage.query.dto';
import { PlanUsageResponseDto, PlanKey } from '../dto/plan-usage.response.dto';

// Gym analytics
import {
  GymHourlyHeatmapQueryDto,
  GymHourlyHeatmapResponseDto,
  HourlyCell,
} from '../dto/gym-hourly-heatmap.dto';
import {
  GymBranchDailyQueryDto,
  GymBranchDailyResponseDto,
  BranchDailySeries,
} from '../dto/gym-branch-daily.dto';

@Injectable()
export class AnalyticsReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------
  // Local helpers (ستُنقل لاحقاً إلى DateRangeUtil)
  // -------------------------------------------------
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

  private resolvePeriod(input: {
    period?: 'today' | '7d' | '30d';
    from?: string;
    to?: string;
  }): {
    fromStart: Date;
    toStart: Date;
    toExclusive: Date;
    fromStr: string;
    toStr: string;
  } {
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

  // -------------------------------------------------
  // Admin/Owner Overview KPI
  // -------------------------------------------------
  async getPlatformOverview(params: {
    period?: 'today' | '7d' | '30d';
    from?: string;
    to?: string;
  }): Promise<AdminOverviewKpiDto> {
    // إزالة toStart لأنه غير مستخدم لتفادي تحذير eslint
    const { fromStart, toExclusive, fromStr, toStr } = this.resolvePeriod(params);

    const totalVisits = await this.prisma.visit.count({
      where: { visitDate: { gte: fromStart, lt: toExclusive } },
    });

    const rows = await this.prisma.$queryRaw<{ date: string; visits: number }[]>`
      SELECT to_char(date_trunc('day', "visitDate"), 'YYYY-MM-DD') AS date,
             COUNT(*)::int AS visits
      FROM "Visit"
      WHERE "visitDate" >= ${fromStart}
        AND "visitDate" < ${toExclusive}
      GROUP BY 1
      ORDER BY 1
    `;

    const ts: { date: string; visits: number }[] = [];
    const map = new Map<string, number>(rows.map((r) => [r.date, r.visits]));
    const cur = new Date(fromStart);
    while (cur < toExclusive) {
      const key = this.toYmd(cur);
      ts.push({ date: key, visits: map.get(key) ?? 0 });
      cur.setDate(cur.getDate() + 1);
    }

    // TODO: لاحقاً نربطها بمصدر الإيرادات والاشتراكات
    const activeSubscriptions = 0;
    const totalRevenue = 0;

    return {
      period: { from: fromStr, to: toStr },
      totalVisits,
      activeSubscriptions,
      totalRevenue,
      timeseries: ts,
    };
  }

  // -------------------------------------------------
  // Admin/Owner - Top Gyms
  // -------------------------------------------------
  async getTopGyms(query: TopGymsQueryDto): Promise<TopGymsResponse> {
    let fromStart: Date;
    let toStart: Date;

    if (query.from && query.to) {
      fromStart = this.parseYmdToLocalStart(query.from);
      toStart = this.parseYmdToLocalStart(query.to);
      if (fromStart > toStart) throw new BadRequestException('from must be <= to');
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      toStart = new Date(today);
      fromStart = new Date(today);
      fromStart.setDate(fromStart.getDate() - 29);
    }

    const toExclusive = new Date(toStart);
    toExclusive.setDate(toExclusive.getDate() + 1);

    const sortBy = query.sortBy ?? TopGymsSortBy.VISITS;
    const order = query.order ?? SortOrder.DESC;
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.max(1, Math.min(100, Number(query.pageSize ?? 10)));

    const grouped = await this.prisma.visit.groupBy({
      by: ['gymId'],
      where: { visitDate: { gte: fromStart, lt: toExclusive } },
      _count: { gymId: true },
    });

    const gymIds = grouped.map((g) => g.gymId);
    if (gymIds.length === 0) {
      return {
        range: { from: this.toYmd(fromStart), to: this.toYmd(toStart), timezone: 'Asia/Riyadh' },
        pagination: { page, pageSize, total: 0, totalPages: 0 },
        sort: { by: sortBy, order },
        items: [],
      };
    }

    const gyms = await this.prisma.gym.findMany({
      where: { id: { in: gymIds } },
      select: { id: true, name: true, visitPrice: true },
    });
    const mapGym = new Map(gyms.map((g) => [g.id, g]));

    const itemsAll = grouped.map((g) => {
      const visits = g._count.gymId ?? 0;
      const gym = mapGym.get(g.gymId);
      const gymName = gym?.name ?? `Gym#${g.gymId}`;
      const visitPrice = Number(gym?.visitPrice ?? 0);
      const revenue = Number((visits * visitPrice).toFixed(2));
      return {
        gymId: String(g.gymId),
        gymName,
        visits,
        revenue,
      };
    });

    itemsAll.sort((a, b) => {
      const key = sortBy === TopGymsSortBy.REVENUE ? 'revenue' : 'visits';
      const cmp = a[key] === b[key] ? 0 : a[key] < b[key] ? -1 : 1;
      return order === SortOrder.ASC ? cmp : -cmp;
    });

    const total = itemsAll.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const paged = start < total ? itemsAll.slice(start, start + pageSize) : [];

    return {
      range: { from: this.toYmd(fromStart), to: this.toYmd(toStart), timezone: 'Asia/Riyadh' },
      pagination: { page, pageSize, total, totalPages },
      sort: { by: sortBy, order },
      items: paged,
    };
  }

  // -------------------------------------------------
  // Admin/Owner — Plan Usage
  // -------------------------------------------------
  private planLimitFallback(plan: PlanKey): number {
    switch (plan) {
      case 'BASIC': return 8;
      case 'STANDARD': return 12;
      case 'PREMIUM': return 20;
      default: return 10;
    }
  }

  private getPlanKeyFromName(name?: string | null): PlanKey {
    if (!name) return 'UNKNOWN';
    const up = (name ?? '').toUpperCase();
    if (up.includes('BASIC')) return 'BASIC';
    if (up.includes('STANDARD')) return 'STANDARD';
    if (up.includes('PREMIUM')) return 'PREMIUM';
    return 'UNKNOWN';
  }

  async getPlanUsage(query: PlanUsageQueryDto): Promise<PlanUsageResponseDto> {
    const { fromStart, toStart, toExclusive } = this.resolvePeriod({
      period: (query.period as any) ?? '30d',
      from: query.from,
      to: query.to,
    });

    const low = typeof query.lowThreshold === 'number' ? query.lowThreshold : 0.3;
    const high = typeof query.highThreshold === 'number' ? query.highThreshold : 0.8;
    if (low < 0 || high > 1 || low >= high) throw new BadRequestException('invalid thresholds');

    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.max(1, Math.min(100, Number(query.pageSize ?? 20)));

    // 1) visits grouped by user + subscriptionId within range
    const grouped = await this.prisma.visit.groupBy({
      by: ['userId', 'subscriptionId'],
      where: { visitDate: { gte: fromStart, lt: toExclusive } },
      _count: { _all: true },
    });

    if (grouped.length === 0) {
      return {
        range: { from: this.toYmd(fromStart), to: this.toYmd(toStart), timezone: 'Asia/Riyadh' },
        thresholds: { low, high },
        pagination: { page, pageSize, total: 0, totalPages: 0 },
        perPlan: [],
        items: [],
      };
    }

    const userIds = Array.from(new Set(grouped.map((g) => g.userId)));
    const subIds = Array.from(
      new Set(grouped.map((g) => g.subscriptionId).filter((x): x is number => x !== null)),
    );

    // 2) fetch subscriptions used (id + name)
    const subs: Array<{ id: number; name: string | null }> = subIds.length
      ? await this.prisma.subscription.findMany({
          where: { id: { in: subIds } },
          select: { id: true, name: true },
        })
      : [];
    const subMap = new Map(subs.map((s) => [s.id, s.name]));

    // 3) pick primary plan per user (subscriptionId with max visits)
    const bestByUser = new Map<number, { subscriptionId: number | null; count: number }>();
    for (const row of grouped) {
      const prev = bestByUser.get(row.userId);
      const cnt = row._count._all ?? 0;
      if (!prev || cnt > prev.count) bestByUser.set(row.userId, { subscriptionId: row.subscriptionId, count: cnt });
    }

    // 4) fetch users
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // 5) build items
    const itemsAll = Array.from(bestByUser.entries()).map(([userId, best]) => {
      const subName = best.subscriptionId ? subMap.get(best.subscriptionId) ?? null : null;
      const plan: PlanKey = this.getPlanKeyFromName(subName);
      const visitLimit = this.planLimitFallback(plan);
      const used = best.count;
      const ratio = visitLimit > 0 ? Math.max(0, Math.min(1, used / visitLimit)) : 0;
      const bucket: 'low' | 'normal' | 'high' = ratio < low ? 'low' : ratio > high ? 'high' : 'normal';
      const u = userMap.get(userId);
      return {
        userId,
        name: u?.name,
        email: u?.email,
        plan,
        visitsUsed: used,
        visitLimit,
        usageRatio: Number(ratio.toFixed(4)),
        bucket,
      };
    });

    // 6) aggregates per plan
    const perPlanMap = new Map<
      PlanKey,
      { plan: PlanKey; subscribers: number; avgUsage: number; medianUsage: number; lowCount: number; highCount: number }
    >();
    (['BASIC', 'STANDARD', 'PREMIUM', 'UNKNOWN'] as PlanKey[]).forEach((p) =>
      perPlanMap.set(p, { plan: p, subscribers: 0, avgUsage: 0, medianUsage: 0, lowCount: 0, highCount: 0 }),
    );

    for (const it of itemsAll) {
      const agg = perPlanMap.get(it.plan)!;
      agg.subscribers += 1;
      agg.avgUsage += it.usageRatio;
      if (it.bucket === 'low') agg.lowCount += 1;
      else if (it.bucket === 'high') agg.highCount += 1;
    }

    for (const [k, agg] of perPlanMap) {
      if (agg.subscribers > 0) {
        agg.avgUsage = Number((agg.avgUsage / agg.subscribers).toFixed(4));
        const ratios = itemsAll
          .filter((x) => x.plan === k)
          .map((x) => x.usageRatio)
          .sort((a, b) => a - b);
        const mid = Math.floor(ratios.length / 2);
        agg.medianUsage = ratios.length % 2 ? ratios[mid] : Number(((ratios[mid - 1] + ratios[mid]) / 2).toFixed(4));
      }
    }

    // 7) pagination
    const total = itemsAll.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const items = start < total ? itemsAll.slice(start, start + pageSize) : [];

    return {
      range: { from: this.toYmd(fromStart), to: this.toYmd(toStart), timezone: 'Asia/Riyadh' },
      thresholds: { low, high },
      pagination: { page, pageSize, total, totalPages },
      perPlan: Array.from(perPlanMap.values()).filter((p) => p.subscribers > 0),
      items,
    };
  }

  // -------------------------------------------------
  // Gym-level analytics
  // -------------------------------------------------

  /** خريطة الزيارات بالساعات (حسب checkedInAt مع مراعاة Asia/Riyadh) */
  async getGymHourlyHeatmap(q: GymHourlyHeatmapQueryDto): Promise<GymHourlyHeatmapResponseDto> {
    const { fromStart, toStart, toExclusive } = this.resolvePeriod({
      period: (q.period as any) ?? '7d',
      from: q.from,
      to: q.to,
    });

    // SQL: استخراج يوم الأسبوع والساعة بعد تحويل المنطقة الزمنية
    const rows: { dow: number; hour: number; visits: number }[] =
      q.branchId !== undefined
        ? await this.prisma.$queryRaw<{ dow: number; hour: number; visits: number }[]>`
          SELECT
            EXTRACT(DOW FROM ("checkedInAt" AT TIME ZONE 'Asia/Riyadh'))::int AS dow,
            EXTRACT(HOUR FROM ("checkedInAt" AT TIME ZONE 'Asia/Riyadh'))::int AS hour,
            COUNT(*)::int AS visits
          FROM "Visit"
          WHERE "gymId" = ${q.gymId}
            AND "branchId" = ${q.branchId}
            AND "checkedInAt" >= ${fromStart}
            AND "checkedInAt" < ${toExclusive}
          GROUP BY 1,2
          ORDER BY 1,2
        `
        : await this.prisma.$queryRaw<{ dow: number; hour: number; visits: number }[]>`
          SELECT
            EXTRACT(DOW FROM ("checkedInAt" AT TIME ZONE 'Asia/Riyadh'))::int AS dow,
            EXTRACT(HOUR FROM ("checkedInAt" AT TIME ZONE 'Asia/Riyadh'))::int AS hour,
            COUNT(*)::int AS visits
          FROM "Visit"
          WHERE "gymId" = ${q.gymId}
            AND "checkedInAt" >= ${fromStart}
            AND "checkedInAt" < ${toExclusive}
          GROUP BY 1,2
          ORDER BY 1,2
        `;

    // ملء المصفوفة 7x24 بالقيم (صفر للفراغات)
    const map = new Map<string, number>();
    for (const r of rows) map.set(`${r.dow}-${r.hour}`, r.visits);

    const heatmap: HourlyCell[] = [];
    for (let dow = 0; dow <= 6; dow++) {
      for (let hour = 0; hour <= 23; hour++) {
        const key = `${dow}-${hour}`;
        heatmap.push({ dow, hour, visits: map.get(key) ?? 0 });
      }
    }

    // حساب ساعات وأيام الذروة
    const hourAgg = new Map<number, number>();
    const dowAgg = new Map<number, number>();
    for (const cell of heatmap) {
      hourAgg.set(cell.hour, (hourAgg.get(cell.hour) ?? 0) + cell.visits);
      dowAgg.set(cell.dow, (dowAgg.get(cell.dow) ?? 0) + cell.visits);
    }
    const topHours = Array.from(hourAgg.entries())
      .map(([hour, visits]) => ({ hour, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5);
    const topDays = Array.from(dowAgg.entries())
      .map(([dow, visits]) => ({ dow, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 3);

    return {
      range: { from: this.toYmd(fromStart), to: this.toYmd(toStart), timezone: 'Asia/Riyadh' },
      params: { gymId: q.gymId, branchId: q.branchId ?? null },
      heatmap,
      peak: { topHours, topDays },
    };
  }

  /** زيارات يومية لكل فرع داخل المدى */
  async getGymBranchDaily(q: GymBranchDailyQueryDto): Promise<GymBranchDailyResponseDto> {
    const { fromStart, toStart, toExclusive } = this.resolvePeriod({
      period: (q.period as any) ?? '30d',
      from: q.from,
      to: q.to,
    });

    // إجمالي الزيارات والمستخدمين المميزين
    const whereBase: Prisma.VisitWhereInput = {
      gymId: q.gymId,
      visitDate: { gte: fromStart, lt: toExclusive },
      ...(q.branchId !== undefined ? { branchId: q.branchId } : {}),
    };
    const totalVisits = await this.prisma.visit.count({ where: whereBase });
    const uniqueUsers = (await this.prisma.visit.groupBy({ by: ['userId'], where: whereBase })).length;

    // إحضار السلاسل اليومية للفروع
    const rows: {
      branchId: number | null;
      branchName: string | null;
      date: string;
      visits: number;
    }[] = q.branchId !== undefined
      ? await this.prisma.$queryRaw<{
          branchId: number | null;
          branchName: string | null;
          date: string;
          visits: number;
        }[]>`
        SELECT
          v."branchId" AS "branchId",
          b."name"     AS "branchName",
          to_char(v."visitDate", 'YYYY-MM-DD') AS "date",
          COUNT(*)::int AS "visits"
        FROM "Visit" v
        LEFT JOIN "Branch" b ON b."id" = v."branchId"
        WHERE v."gymId" = ${q.gymId}
          AND v."branchId" = ${q.branchId}
          AND v."visitDate" >= ${fromStart}
          AND v."visitDate" < ${toExclusive}
        GROUP BY v."branchId", b."name", "date"
        ORDER BY v."branchId", "date"
      `
      : await this.prisma.$queryRaw<{
          branchId: number | null;
          branchName: string | null;
          date: string;
          visits: number;
        }[]>`
        SELECT
          v."branchId" AS "branchId",
          b."name"     AS "branchName",
          to_char(v."visitDate", 'YYYY-MM-DD') AS "date",
          COUNT(*)::int AS "visits"
        FROM "Visit" v
        LEFT JOIN "Branch" b ON b."id" = v."branchId"
        WHERE v."gymId" = ${q.gymId}
          AND v."visitDate" >= ${fromStart}
          AND v."visitDate" < ${toExclusive}
        GROUP BY v."branchId", b."name", "date"
        ORDER BY v."branchId", "date"
      `;

    // تجهيز قائمة التواريخ الكاملة للمدى
    const allDates: string[] = [];
    const cur = new Date(fromStart);
    while (cur < toExclusive) {
      allDates.push(this.toYmd(cur));
      cur.setDate(cur.getDate() + 1);
    }

    // تجميع حسب الفرع
    const seriesMap = new Map<number, BranchDailySeries>();
    for (const r of rows) {
      const id = r.branchId ?? 0; // 0 لزيارات بدون فرع محدد
      if (!seriesMap.has(id)) {
        seriesMap.set(id, {
          branchId: id,
          branchName: r.branchName ?? (id === 0 ? 'Unassigned' : `Branch#${id}`),
          points: [],
        });
      }
    }
    // املأ كل الأيام بقيم صفرية
    for (const [, ser] of seriesMap) {
      ser.points = allDates.map((d) => ({ date: d, visits: 0 }));
    }
    // عبّئ القيم الموجودة
    const indexByDate = new Map(allDates.map((d, i) => [d, i]));
    for (const r of rows) {
      const id = r.branchId ?? 0;
      const ser = seriesMap.get(id)!;
      const idx = indexByDate.get(r.date);
      if (idx !== undefined) ser.points[idx].visits = r.visits;
    }

    const series = Array.from(seriesMap.values()).sort((a, b) =>
      a.branchId === b.branchId ? 0 : a.branchId < b.branchId ? -1 : 1,
    );

    return {
      range: { from: this.toYmd(fromStart), to: this.toYmd(toStart), timezone: 'Asia/Riyadh' },
      series,
      totals: { visits: totalVisits, uniqueUsers },
    };
  }
}
