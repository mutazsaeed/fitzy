/* eslint-disable prettier/prettier */
// cspell:disable
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

import {
  ReconciliationQueryDto,
  RecoOrder,
  RecoSortBy,
} from '../dto/reconciliation.query.dto';
import { ReconciliationResponseDto } from '../dto/reconciliation.response.dto';

@Injectable()
export class ReconciliationService {
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

  /** resolve YYYY-MM month or explicit from/to for reconciliation */
  private resolveRecoRange(q: {
    month?: string;
    from?: string;
    to?: string;
  }): {
    fromStart: Date;
    toStart: Date;
    toExclusive: Date;
    fromStr: string;
    toStr: string;
    invoiceMonthTag: string; // e.g. '202509'
  } {
    let fromStart: Date;
    let toStart: Date;

    if (q.month) {
      const m = /^(\d{4})-(\d{2})$/.exec(q.month);
      if (!m) throw new BadRequestException('month must be YYYY-MM');
      const [, y, mo] = m;
      fromStart = new Date(Number(y), Number(mo) - 1, 1, 0, 0, 0, 0);
      toStart = new Date(fromStart);
      // last day of month
      toStart.setMonth(toStart.getMonth() + 1);
      toStart.setDate(toStart.getDate() - 1);
    } else if (q.from && q.to) {
      fromStart = this.parseYmdToLocalStart(q.from);
      toStart = this.parseYmdToLocalStart(q.to);
      if (fromStart > toStart) throw new BadRequestException('from must be <= to');
    } else {
      // default to current month
      const now = new Date();
      fromStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      toStart = new Date(fromStart);
      toStart.setMonth(toStart.getMonth() + 1);
      toStart.setDate(toStart.getDate() - 1);
    }

    const toExclusive = new Date(toStart);
    toExclusive.setDate(toExclusive.getDate() + 1);

    const tag = `${toStart.getFullYear()}${`${toStart.getMonth() + 1}`.padStart(2, '0')}`; // yyyymm

    return {
      fromStart,
      toStart,
      toExclusive,
      fromStr: this.toYmd(fromStart),
      toStr: this.toYmd(toStart),
      invoiceMonthTag: tag,
    };
  }

  // -------------------------------------------------
  // Monthly Reconciliation (All Clubs)
  // -------------------------------------------------
  async getMonthlyReconciliation(query: ReconciliationQueryDto): Promise<ReconciliationResponseDto> {
    const { fromStart, toExclusive, fromStr, toStr, invoiceMonthTag } =
      this.resolveRecoRange({ month: query.month, from: query.from, to: query.to });

    const sortBy = query.sortBy ?? RecoSortBy.DUES;
    const order = query.order ?? RecoOrder.DESC;
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.max(1, Math.min(100, Number(query.pageSize ?? 20)));

    // 1) group visits by gymId in range
    const grouped = await this.prisma.visit.groupBy({
      by: ['gymId'],
      where: { visitDate: { gte: fromStart, lt: toExclusive } },
      _count: { gymId: true },
    });

    if (grouped.length === 0) {
      return {
        range: { from: fromStr, to: toStr, timezone: 'Asia/Riyadh' },
        pagination: { page, pageSize, total: 0, totalPages: 0 },
        sort: { by: sortBy, order },
        items: [],
        totals: { totalVisits: 0, totalDues: 0 },
      };
    }

    // 2) fetch gyms info (name, visitPrice)
    const gymIds = grouped.map((g) => g.gymId);
    const gyms = await this.prisma.gym.findMany({
      where: { id: { in: gymIds } },
      select: { id: true, name: true, visitPrice: true },
    });
    const mapGym = new Map(gyms.map((g) => [g.id, g]));

    // 3) build items with dues + invoice number
    const itemsAll = grouped.map((g) => {
      const visits = g._count.gymId ?? 0;
      const gym = mapGym.get(g.gymId);
      const gymName = gym?.name ?? `Gym#${g.gymId}`;
      const visitPrice = gym?.visitPrice ?? null;
      const dues = visitPrice ? Number((visits * Number(visitPrice)).toFixed(2)) : 0;
      const invoiceNumber = `INV-${invoiceMonthTag}-${g.gymId}`;
      return {
        gymId: g.gymId,
        gymName,
        visitPrice: visitPrice === null ? null : Number(visitPrice),
        visits,
        dues,
        invoiceNumber,
      };
    });

    // 4) sort
    itemsAll.sort((a, b) => {
      let cmp: number;
      switch (sortBy) {
        case RecoSortBy.GYM_NAME:
          cmp = a.gymName.localeCompare(b.gymName);
          break;
        case RecoSortBy.VISITS:
          cmp = a.visits === b.visits ? 0 : a.visits < b.visits ? -1 : 1;
          break;
        case RecoSortBy.DUES:
        default:
          cmp = a.dues === b.dues ? 0 : a.dues < b.dues ? -1 : 1;
          break;
      }
      return order === RecoOrder.ASC ? cmp : -cmp;
    });

    // 5) totals
    const totalVisits = itemsAll.reduce((s, x) => s + x.visits, 0);
    const totalDues = Number(itemsAll.reduce((s, x) => s + x.dues, 0).toFixed(2));

    // 6) paginate
    const total = itemsAll.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const items = start < total ? itemsAll.slice(start, start + pageSize) : [];

    // 7) response
    return {
      range: { from: fromStr, to: toStr, timezone: 'Asia/Riyadh' },
      pagination: { page, pageSize, total, totalPages },
      sort: { by: sortBy, order },
      items,
      totals: { totalVisits, totalDues },
    };
  }

  // -------------------------------------------------
  // Internal dataset builder for exports (CSV/PDF)
  // -------------------------------------------------
  async buildRecoExport(query: ReconciliationQueryDto): Promise<{
    range: { from: string; to: string; timezone: string };
    items: { gymId: number; gymName: string; visitPrice: number | null; visits: number; dues: number; invoiceNumber: string }[];
    totals: { totalVisits: number; totalDues: number };
    invoiceMonthTag: string;
  }> {
    const { fromStart, toExclusive, fromStr, toStr, invoiceMonthTag } =
      this.resolveRecoRange({ month: query.month, from: query.from, to: query.to });

    const sortBy = query.sortBy ?? RecoSortBy.DUES;
    const order = query.order ?? RecoOrder.DESC;

    const grouped = await this.prisma.visit.groupBy({
      by: ['gymId'],
      where: { visitDate: { gte: fromStart, lt: toExclusive } },
      _count: { gymId: true },
    });

    const gymIds = grouped.map((g) => g.gymId);
    const gyms = gymIds.length
      ? await this.prisma.gym.findMany({
          where: { id: { in: gymIds } },
          select: { id: true, name: true, visitPrice: true },
        })
      : [];

    const mapGym = new Map(gyms.map((g) => [g.id, g]));
    const itemsAll = grouped.map((g) => {
      const visits = g._count.gymId ?? 0;
      const gym = mapGym.get(g.gymId);
      const gymName = gym?.name ?? `Gym#${g.gymId}`;
      const visitPrice = gym?.visitPrice ?? null;
      const dues = visitPrice ? Number((visits * Number(visitPrice)).toFixed(2)) : 0;
      const invoiceNumber = `INV-${invoiceMonthTag}-${g.gymId}`;
      return {
        gymId: g.gymId,
        gymName,
        visitPrice: visitPrice === null ? null : Number(visitPrice),
        visits,
        dues,
        invoiceNumber,
      };
    });

    itemsAll.sort((a, b) => {
      let cmp: number;
      switch (sortBy) {
        case RecoSortBy.GYM_NAME:
          cmp = a.gymName.localeCompare(b.gymName);
          break;
        case RecoSortBy.VISITS:
          cmp = a.visits === b.visits ? 0 : a.visits < b.visits ? -1 : 1;
          break;
        case RecoSortBy.DUES:
        default:
          cmp = a.dues === b.dues ? 0 : a.dues < b.dues ? -1 : 1;
          break;
      }
      return order === RecoOrder.ASC ? cmp : -cmp;
    });

    const totalVisits = itemsAll.reduce((s, x) => s + x.visits, 0);
    const totalDues = Number(itemsAll.reduce((s, x) => s + x.dues, 0).toFixed(2));

    return {
      range: { from: fromStr, to: toStr, timezone: 'Asia/Riyadh' },
      items: itemsAll,
      totals: { totalVisits, totalDues },
      invoiceMonthTag,
    };
  }
}
