/* eslint-disable prettier/prettier */
import { Injectable, ForbiddenException } from '@nestjs/common';
import { Prisma, AdminRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// استبدل ReportingService بالخدمات الجديدة
import { AnalyticsReportsService } from '../reporting/services/analytics-reports.service';

// Top Gyms DTOs
import {
  TopGymsQueryDto,
  TopGymsSortBy,
  SortOrder,
} from '../reporting/dto/top-gyms.query.dto';

export type PeriodKey = 'today' | '7d' | '30d';

export type GymDuesSortBy = 'visits' | 'dues';
export type GymDuesOrder = 'asc' | 'desc';

export interface GymDuesQuery {
  period?: PeriodKey;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  sortBy?: GymDuesSortBy;
  order?: GymDuesOrder;
  page?: number;
  pageSize?: number;
}

export interface GymDuesItem {
  gymId: number;
  gymName: string;
  visits: number;
  visitPrice: number;
  dues: number;
}

export interface GymDuesResponse {
  range: { from: string; to: string; timezone: string };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  sort: { by: GymDuesSortBy; order: GymDuesOrder };
  items: GymDuesItem[];
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsReportsService, // بدل ReportingService
  ) {}

  // ========= Helpers =========
  private assertRole(user: { role: AdminRole }, allowed: AdminRole[]) {
    if (!allowed.includes(user.role)) {
      throw new ForbiddenException('Forbidden');
    }
  }

  private parseYmdToLocalStart(ymd: string): Date {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    if (!m) throw new Error('Invalid date format, expected YYYY-MM-DD');
    const [, y, mo, d] = m;
    const dt = new Date(Number(y), Number(mo) - 1, Number(d), 0, 0, 0, 0);
    if (isNaN(dt.getTime())) throw new Error('Invalid date value');
    return dt;
  }

  private toYmd(d: Date): string {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private resolvePeriod(input: { period?: PeriodKey; from?: string; to?: string }) {
    let fromStart: Date;
    let toStart: Date;

    if (input.from && input.to) {
      fromStart = this.parseYmdToLocalStart(input.from);
      toStart = this.parseYmdToLocalStart(input.to);
      if (fromStart > toStart) throw new Error('from must be <= to');
    } else {
      const p: PeriodKey = input.period ?? '30d';
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      switch (p) {
        case 'today':
          fromStart = new Date(today);
          toStart = new Date(today);
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
      toExclusive,
      fromStr: this.toYmd(fromStart),
      toStr: this.toYmd(toStart),
    };
  }

  // ========= Admin CRUD =========

  async getAllAdmins(current: { id: number; role: AdminRole }) {
    this.assertRole(current, [AdminRole.OWNER, AdminRole.MANAGER]);
    return this.prisma.admin.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { id: 'asc' },
    });
  }

  async createAdmin(
    current: { id: number; role: AdminRole },
    body: { name: string; email: string; password: string; role: AdminRole },
  ) {
    this.assertRole(current, [AdminRole.OWNER]);

    // عند تفعيل التجزئة مستقبلاً: خزّن القيمة المجزّأة في الحقل password
    return this.prisma.admin.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        password: body.password,
        role: body.role,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  }

  async getAdminById(current: { id: number; role: AdminRole }, id: number) {
    this.assertRole(current, [AdminRole.OWNER, AdminRole.MANAGER, AdminRole.SUPERVISOR]);
    return this.prisma.admin.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  }

  async updateAdmin(
    current: { id: number; role: AdminRole },
    id: number,
    body: Partial<{ name: string; email: string; password: string; role: AdminRole }>,
  ) {
    this.assertRole(current, [AdminRole.OWNER]);

    const data: Prisma.AdminUpdateInput = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.email !== undefined) data.email = body.email.toLowerCase();
    if (body.password !== undefined) data.password = body.password;
    if (body.role !== undefined) data.role = body.role;

    return this.prisma.admin.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  }

  async deleteAdmin(current: { id: number; role: AdminRole }, id: number) {
    this.assertRole(current, [AdminRole.OWNER]);
    await this.prisma.admin.delete({ where: { id } });
    return { success: true };
  }

  // ========= Reports (basic) =========

  async getReports(current: { id: number; role: AdminRole }) {
    this.assertRole(current, [AdminRole.OWNER, AdminRole.MANAGER, AdminRole.SUPERVISOR]);
    return this.analytics.getPlatformOverview({ period: '30d' });
  }

  async getOverviewKpis(
    current: { id: number; role: AdminRole },
    opts: { period?: PeriodKey; from?: string; to?: string },
  ) {
    this.assertRole(current, [AdminRole.OWNER, AdminRole.MANAGER, AdminRole.SUPERVISOR]);
    return this.analytics.getPlatformOverview(opts);
  }

  // ========= Top Gyms =========

  async getTopGyms(
    current: { id: number; role: AdminRole },
    query: {
      from?: string;
      to?: string;
      sortBy?: 'visits' | 'revenue';
      order?: 'asc' | 'desc';
      page?: number;
      pageSize?: number;
    },
  ) {
    this.assertRole(current, [AdminRole.OWNER, AdminRole.MANAGER]);

    const sortBy =
      query.sortBy === 'revenue' ? TopGymsSortBy.REVENUE : TopGymsSortBy.VISITS;
    const order = query.order === 'asc' ? SortOrder.ASC : SortOrder.DESC;

    const dto: TopGymsQueryDto = {
      from: query.from,
      to: query.to,
      sortBy,
      order,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 10,
    };

    return this.analytics.getTopGyms(dto);
  }

  // ========= Gym Dues (مستحقات الأندية) =========

  async getGymDues(
    current: { id: number; role: AdminRole },
    query: GymDuesQuery,
  ): Promise<GymDuesResponse> {
    this.assertRole(current, [AdminRole.OWNER, AdminRole.MANAGER]);

    const { fromStart, toExclusive, fromStr, toStr } = this.resolvePeriod({
      period: query.period,
      from: query.from,
      to: query.to,
    });

    // visits grouped by gymId
    const grouped = await this.prisma.visit.groupBy({
      by: ['gymId'],
      where: { visitDate: { gte: fromStart, lt: toExclusive } },
      _count: { _all: true },
    });

    const gymIds = grouped.map((g) => g.gymId);
    const gyms =
      gymIds.length > 0
        ? await this.prisma.gym.findMany({
            where: { id: { in: gymIds } },
            select: { id: true, name: true, visitPrice: true },
          })
        : [];

    const gymMap = new Map(gyms.map((g) => [g.id, g]));

    // build items
    const itemsAll: GymDuesItem[] = grouped.map((g) => {
      const gym = gymMap.get(g.gymId);
      const visits = g._count._all ?? 0;
      const visitPrice = gym?.visitPrice ?? 0;
      const dues = Number((visits * visitPrice).toFixed(2));
      return {
        gymId: g.gymId,
        gymName: gym?.name ?? `Gym #${g.gymId}`,
        visits,
        visitPrice,
        dues,
      };
    });

    // sort
    const sortBy: GymDuesSortBy =
      query.sortBy === 'visits' || query.sortBy === 'dues' ? query.sortBy : 'dues';
    const order: GymDuesOrder = query.order === 'asc' ? 'asc' : 'desc';

    itemsAll.sort((a, b) => {
      const av = sortBy === 'visits' ? a.visits : a.dues;
      const bv = sortBy === 'visits' ? b.visits : b.dues;
      return order === 'asc' ? av - bv : bv - av;
    });

    // pagination
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize =
      query.pageSize && query.pageSize >= 1 && query.pageSize <= 100 ? query.pageSize : 10;
    const total = itemsAll.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const startIdx = (page - 1) * pageSize;
    const items = itemsAll.slice(startIdx, startIdx + pageSize);

    return {
      range: { from: fromStr, to: toStr, timezone: 'Asia/Riyadh' },
      pagination: { page, pageSize, total, totalPages },
      sort: { by: sortBy, order },
      items,
    };
  }

  buildGymDuesCsv(items: GymDuesItem[]): string {
    const header = ['gymId', 'gymName', 'visits', 'visitPrice', 'dues'].join(',');
    const lines = items.map((i) => {
      const id = String(i.gymId);
      const name = /,/.test(i.gymName) ? `"${i.gymName.replace(/"/g, '""')}"` : i.gymName;
      const visits = String(i.visits);
      const price = i.visitPrice.toFixed(2);
      const dues = i.dues.toFixed(2);
      return [id, name, visits, price, dues].join(',');
    });
    return [header, ...lines].join('\n') + '\n';
  }
}
