/* eslint-disable prettier/prettier */
// cspell:disable
import { Injectable, BadRequestException } from '@nestjs/common';
import { GymAdminTodayReportDto } from './dto/gym-admin-today-report.dto';
import { GymAdminRangeReportDto } from './dto/gym-admin-range-report.dto';
import { GymAdminTopUsersDto } from './dto/gym-admin-top-users.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * helper: build Visit where clause
   */
  private buildVisitWhere(input: {
    gymId: number;
    from?: Date;
    toExclusive?: Date;
    branchId?: number;
  }): Prisma.VisitWhereInput {
    const where: Prisma.VisitWhereInput = {
      gymId: input.gymId,
    };
    if (input.from && input.toExclusive) {
      where.visitDate = { gte: input.from, lt: input.toExclusive };
    }
    if (input.branchId !== undefined) {
      // VisitWhereInput.branchId supports number | IntNullableFilter | null
      where.branchId = input.branchId;
    }
    return where;
  }

  /**
   * Gym Supervisor - today's report for the given gym.
   * Counts total visits and unique users for "today" (server local day).
   */
  async getGymAdminToday(params: {
    gymId: number;
    branchId?: number; // NEW
  }): Promise<GymAdminTodayReportDto> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);

    const whereBase = this.buildVisitWhere({
      gymId: params.gymId,
      from: todayStart,
      toExclusive: tomorrowStart,
      branchId: params.branchId,
    });

    const totalVisitsToday = await this.prisma.visit.count({
      where: whereBase,
    });

    const uniqueUsersGroup = await this.prisma.visit.groupBy({
      by: ['userId'],
      where: whereBase,
    });

    return {
      totalVisitsToday,
      uniqueUsersToday: uniqueUsersGroup.length,
    };
  }

  /**
   * Parse YYYY-MM-DD into a Date at local 00:00.
   */
  private parseYmdToLocalStart(ymd: string): Date {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    if (!m) {
      throw new BadRequestException('Invalid date format, expected YYYY-MM-DD');
    }
    const [, y, mo, d] = m;
    const dt = new Date(Number(y), Number(mo) - 1, Number(d), 0, 0, 0, 0);
    if (isNaN(dt.getTime())) {
      throw new BadRequestException('Invalid date value');
    }
    return dt;
  }

  // helper: format Date → 'YYYY-MM-DD'
  private toYmd(d: Date): string {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /**
   * Gym Supervisor - range report (from/to inclusive of "to" day).
   * Returns totalVisits, uniqueUsers, dailyBreakdown.
   */
  async getGymAdminRange(params: {
    gymId: number;
    from: string; // YYYY-MM-DD
    to: string; // YYYY-MM-DD
    branchId?: number; // NEW
  }): Promise<GymAdminRangeReportDto> {
    const fromStart = this.parseYmdToLocalStart(params.from);
    const toStart = this.parseYmdToLocalStart(params.to);
    if (fromStart > toStart) {
      throw new BadRequestException('from must be <= to');
    }

    // toExclusive = start of next day after "to"
    const toExclusive = new Date(toStart);
    toExclusive.setDate(toExclusive.getDate() + 1);

    const whereBase = this.buildVisitWhere({
      gymId: params.gymId,
      from: fromStart,
      toExclusive,
      branchId: params.branchId,
    });

    const totalVisits = await this.prisma.visit.count({ where: whereBase });

    const uniqueUsersGroup = await this.prisma.visit.groupBy({
      by: ['userId'],
      where: whereBase,
    });
    const uniqueUsers = uniqueUsersGroup.length;

    // daily breakdown via SQL (branch filtered if provided)
    let rows: { date: string; visits: number }[] = [];
    if (params.branchId !== undefined) {
      rows = await this.prisma.$queryRaw<
        { date: string; visits: number }[]
      >`
        SELECT to_char(date_trunc('day', "visitDate"), 'YYYY-MM-DD') AS date,
               COUNT(*)::int AS visits
        FROM "Visit"
        WHERE "gymId" = ${params.gymId}
          AND "branchId" = ${params.branchId}
          AND "visitDate" >= ${fromStart}
          AND "visitDate" < ${toExclusive}
        GROUP BY 1
        ORDER BY 1
      `;
    } else {
      rows = await this.prisma.$queryRaw<
        { date: string; visits: number }[]
      >`
        SELECT to_char(date_trunc('day', "visitDate"), 'YYYY-MM-DD') AS date,
               COUNT(*)::int AS visits
        FROM "Visit"
        WHERE "gymId" = ${params.gymId}
          AND "visitDate" >= ${fromStart}
          AND "visitDate" < ${toExclusive}
        GROUP BY 1
        ORDER BY 1
      `;
    }

    const dailyBreakdown: { date: string; visits: number }[] = [];
    const map = new Map(rows.map((r) => [r.date, r.visits]));
    const cur = new Date(fromStart);
    while (cur < toExclusive) {
      const y = cur.getFullYear();
      const m = `${cur.getMonth() + 1}`.padStart(2, '0');
      const d = `${cur.getDate()}`.padStart(2, '0');
      const key = `${y}-${m}-${d}`;
      dailyBreakdown.push({ date: key, visits: map.get(key) ?? 0 });
      cur.setDate(cur.getDate() + 1);
    }

    return {
      totalVisits,
      uniqueUsers,
      dailyBreakdown,
    };
  }

  /**
   * Gym Supervisor - top users by visit count within a range (default last 30 days).
   * If from/to omitted, uses [today-29 .. today] inclusive.
   */
  async getGymAdminTopUsers(params: {
    gymId: number;
    limit?: number; // default 10
    from?: string; // YYYY-MM-DD (optional)
    to?: string; // YYYY-MM-DD (optional)
    branchId?: number; // NEW
  }): Promise<GymAdminTopUsersDto> {
    const limit = Math.max(1, Math.min(100, params.limit ?? 10));

    // resolve range
    let fromStart: Date;
    let toStart: Date;
    if (params.from && params.to) {
      fromStart = this.parseYmdToLocalStart(params.from);
      toStart = this.parseYmdToLocalStart(params.to);
      if (fromStart > toStart) {
        throw new BadRequestException('from must be <= to');
      }
    } else {
      toStart = new Date();
      toStart.setHours(0, 0, 0, 0);
      fromStart = new Date(toStart);
      fromStart.setDate(fromStart.getDate() - 29);
    }
    const toExclusive = new Date(toStart);
    toExclusive.setDate(toExclusive.getDate() + 1);

    const whereBase = this.buildVisitWhere({
      gymId: params.gymId,
      from: fromStart,
      toExclusive,
      branchId: params.branchId,
    });

    const grouped = await this.prisma.visit.groupBy({
      by: ['userId'],
      where: whereBase,
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: limit,
    });

    const userIds = grouped.map((g) => g.userId);
    const users =
      userIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true },
          })
        : [];

    const mapUser = new Map(users.map((u) => [u.id, u]));

    const items = grouped.map((g) => ({
      userId: g.userId,
      visits: g._count?.userId ?? 0,
      name: mapUser.get(g.userId)?.name,
      email: mapUser.get(g.userId)?.email,
    }));

    return {
      range: { from: this.toYmd(fromStart), to: this.toYmd(toStart) },
      items,
    };
  }
}
