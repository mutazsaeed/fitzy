/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  Res,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminRole } from '@prisma/client';
import { AdminService } from './admin.service';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import type { GymDuesResponse, GymDuesItem } from './admin.service';

// ✅ استيراد PDFKit بصيغة متوافقة مع CommonJS/TypeScript (آمنة حتى بدون esModuleInterop)
import PDFDocument = require('pdfkit');

type JwtRequest = ExpressRequest & { user: { id: number; role: AdminRole } };

@Controller('admins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // GET /admins
  @Get()
  @Roles('OWNER', 'MANAGER')
  async getAllAdmins(@Req() req: JwtRequest) {
    return this.adminService.getAllAdmins(req.user);
  }

  // POST /admins
  @Post()
  @Roles('OWNER')
  async createAdmin(
    @Req() req: JwtRequest,
    @Body() body: { name: string; email: string; password: string; role: AdminRole },
  ) {
    return this.adminService.createAdmin(req.user, body);
  }

  // GET /admins/:id
  @Get(':id')
  @Roles('OWNER', 'MANAGER', 'SUPERVISOR')
  async getAdminById(@Req() req: JwtRequest, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.getAdminById(req.user, id);
  }

  // PUT /admins/:id
  @Put(':id')
  @Roles('OWNER')
  async updateAdmin(
    @Req() req: JwtRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<{ name: string; email: string; password: string; role: AdminRole }>,
  ) {
    return this.adminService.updateAdmin(req.user, id, body);
  }

  // DELETE /admins/:id
  @Delete(':id')
  @Roles('OWNER')
  async deleteAdmin(@Req() req: JwtRequest, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteAdmin(req.user, id);
  }

  // GET /admins/reports
  @Get('reports')
  @Roles('SUPERVISOR', 'MANAGER', 'OWNER')
  async getReports(@Req() req: JwtRequest) {
    return this.adminService.getReports(req.user);
  }

  // GET /admins/overview-kpis
  @Get('overview-kpis')
  @Roles('SUPERVISOR', 'MANAGER', 'OWNER')
  async getOverviewKpis(
    @Req() req: JwtRequest,
    @Query('period') period?: 'today' | '7d' | '30d',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (period && (period !== 'today' && period !== '7d' && period !== '30d')) {
      throw new BadRequestException('period must be one of today|7d|30d');
    }
    if ((from && !to) || (!from && to)) {
      throw new BadRequestException('from and to must be provided together');
    }
    if (
      (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) ||
      (to && !/^\d{4}-\d{2}-\d{2}$/.test(to))
    ) {
      throw new BadRequestException('from/to must be YYYY-MM-DD');
    }

    return this.adminService.getOverviewKpis(req.user, { period, from, to });
  }

  // GET /admins/reports/top-gyms
  @Get('reports/top-gyms')
  @Roles('OWNER', 'MANAGER')
  async getTopGyms(
    @Req() req: JwtRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sortBy') sortBy?: 'visits' | 'revenue',
    @Query('order') order?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    if ((from && !to) || (!from && to)) {
      throw new BadRequestException('from and to must be provided together');
    }
    if (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) {
      throw new BadRequestException('from must be YYYY-MM-DD');
    }
    if (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      throw new BadRequestException('to must be YYYY-MM-DD');
    }
    if (sortBy && sortBy !== 'visits' && sortBy !== 'revenue') {
      throw new BadRequestException("sortBy must be 'visits' or 'revenue'");
    }
    if (order && order !== 'asc' && order !== 'desc') {
      throw new BadRequestException("order must be 'asc' or 'desc'");
    }
    if (page && (!/^\d+$/.test(page) || Number(page) < 1)) {
      throw new BadRequestException('page must be an integer >= 1');
    }
    if (
      pageSize &&
      (!/^\d+$/.test(pageSize) || Number(pageSize) < 1 || Number(pageSize) > 100)
    ) {
      throw new BadRequestException('pageSize must be an integer between 1 and 100');
    }

    const query: {
      from?: string;
      to?: string;
      sortBy?: 'visits' | 'revenue';
      order?: 'asc' | 'desc';
      page?: number;
      pageSize?: number;
    } = {};

    if (from) query.from = from;
    if (to) query.to = to;
    if (sortBy) query.sortBy = sortBy;
    if (order) query.order = order;
    if (page) query.page = Number(page);
    if (pageSize) query.pageSize = Number(pageSize);

    return this.adminService.getTopGyms(req.user, query);
  }

  // GET /admins/reports/gym-dues (JSON)
  @Get('reports/gym-dues')
  @Roles('OWNER', 'MANAGER')
  async getGymDues(
    @Req() req: JwtRequest,
    @Query('period') period?: 'today' | '7d' | '30d',
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sortBy') sortBy?: 'dues' | 'visits',
    @Query('order') order?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<GymDuesResponse> {
    if (period && (period !== 'today' && period !== '7d' && period !== '30d')) {
      throw new BadRequestException('period must be one of today|7d|30d');
    }
    if ((from && !to) || (!from && to)) {
      throw new BadRequestException('from and to must be provided together');
    }
    if (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) {
      throw new BadRequestException('from must be YYYY-MM-DD');
    }
    if (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      throw new BadRequestException('to must be YYYY-MM-DD');
    }
    if (sortBy && sortBy !== 'dues' && sortBy !== 'visits') {
      throw new BadRequestException("sortBy must be 'dues' or 'visits'");
    }
    if (order && order !== 'asc' && order !== 'desc') {
      throw new BadRequestException("order must be 'asc' or 'desc'");
    }
    if (page && (!/^\d+$/.test(page) || Number(page) < 1)) {
      throw new BadRequestException('page must be an integer >= 1');
    }
    if (
      pageSize &&
      (!/^\d+$/.test(pageSize) || Number(pageSize) < 1 || Number(pageSize) > 100)
    ) {
      throw new BadRequestException('pageSize must be an integer between 1 and 100');
    }

    const query = {
      period,
      from,
      to,
      sortBy,
      order,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    };

    return this.adminService.getGymDues(req.user, query);
  }

  // GET /admins/reports/gym-dues/export.csv (CSV)
  @Get('reports/gym-dues/export.csv')
  @Roles('OWNER', 'MANAGER')
  async exportGymDuesCsv(
    @Req() req: JwtRequest,
    @Res() res: ExpressResponse,
    @Query('period') period?: 'today' | '7d' | '30d',
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sortBy') sortBy?: 'dues' | 'visits',
    @Query('order') order?: 'asc' | 'desc',
  ) {
    if (period && (period !== 'today' && period !== '7d' && period !== '30d')) {
      throw new BadRequestException('period must be one of today|7d|30d');
    }
    if ((from && !to) || (!from && to)) {
      throw new BadRequestException('from and to must be provided together');
    }
    if (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) {
      throw new BadRequestException('from must be YYYY-MM-DD');
    }
    if (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      throw new BadRequestException('to must be YYYY-MM-DD');
    }
    if (sortBy && sortBy !== 'dues' && sortBy !== 'visits') {
      throw new BadRequestException("sortBy must be 'dues' or 'visits'");
    }
    if (order && order !== 'asc' && order !== 'desc') {
      throw new BadRequestException("order must be 'asc' or 'desc'");
    }

    const data: GymDuesResponse = await this.adminService.getGymDues(req.user, {
      period,
      from,
      to,
      sortBy,
      order,
      page: 1,
      pageSize: 1000,
    });

    const csv = this.adminService.buildGymDuesCsv(data.items);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="gym-dues.csv"');
    res.send(csv);
  }

  // GET /admins/reports/gym-dues/export.pdf (PDF)
  @Get('reports/gym-dues/export.pdf')
  @Roles('OWNER', 'MANAGER')
  async exportGymDuesPdf(
    @Req() req: JwtRequest,
    @Res() res: ExpressResponse,
    @Query('period') period?: 'today' | '7d' | '30d',
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sortBy') sortBy?: 'dues' | 'visits',
    @Query('order') order?: 'asc' | 'desc',
  ) {
    if (period && (period !== 'today' && period !== '7d' && period !== '30d')) {
      throw new BadRequestException('period must be one of today|7d|30d');
    }
    if ((from && !to) || (!from && to)) {
      throw new BadRequestException('from and to must be provided together');
    }
    if (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) {
      throw new BadRequestException('from must be YYYY-MM-DD');
    }
    if (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      throw new BadRequestException('to must be YYYY-MM-DD');
    }
    if (sortBy && sortBy !== 'dues' && sortBy !== 'visits') {
      throw new BadRequestException("sortBy must be 'dues' or 'visits'");
    }
    if (order && order !== 'asc' && order !== 'desc') {
      throw new BadRequestException("order must be 'asc' or 'desc'");
    }

    const data: GymDuesResponse = await this.adminService.getGymDues(req.user, {
      period,
      from,
      to,
      sortBy,
      order,
      page: 1,
      pageSize: 1000,
    });

    // ترويسـة الاستجابة
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="gym-dues.pdf"');

    // إنشاء المستند وبثّه
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    // العنوان والنطاق
    doc.fontSize(16).text('Gym Dues Report').moveDown(0.5);
    doc
      .fontSize(10)
      .text(
        `Range: ${data.range.from} → ${data.range.to} (${data.range.timezone}) | Sorted by: ${data.sort.by} ${data.sort.order}`,
      )
      .moveDown();

    // العناوين
    const col1 = 230; // gym name
    const col2 = 80;  // visits
    const col3 = 100; // visit price
    const col4 = 100; // dues

    doc
      .fontSize(12)
      .text('Gym Name', { continued: true, width: col1 })
      .text('Visits', { continued: true, width: col2, align: 'right' })
      .text('Visit Price', { continued: true, width: col3, align: 'right' })
      .text('Dues', { width: col4, align: 'right' })
      .moveDown(0.2);

    // خط فاصل
    doc.text('-'.repeat(80)).moveDown(0.3);

    // الصفوف
    const items: GymDuesItem[] = data.items;
    for (const row of items) {
      doc
        .fontSize(11)
        .text(row.gymName, { continued: true, width: col1 })
        .text(String(row.visits), { continued: true, width: col2, align: 'right' })
        .text(row.visitPrice.toFixed(2), { continued: true, width: col3, align: 'right' })
        .text(row.dues.toFixed(2), { width: col4, align: 'right' });
    }

    doc.end();
  }
}
