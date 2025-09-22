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
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminRole } from '@prisma/client';
import { AdminService } from './admin.service';

interface JwtRequest extends Request {
  user: { id: number; role: AdminRole };
}

@Controller('admins')
@UseGuards(JwtAuthGuard, RolesGuard) // ✅ الحماية بالتوكن + الأدوار
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ✅ GET /admins → جلب كل الأدمنز (OWNER و MANAGER فقط)
  @Get()
  @Roles('OWNER', 'MANAGER')
  async getAllAdmins(@Request() req: JwtRequest) {
    return this.adminService.getAllAdmins(req.user);
  }

  // ✅ POST /admins → إضافة أدمن جديد (OWNER فقط)
  @Post()
  @Roles('OWNER')
  async createAdmin(
    @Request() req: JwtRequest,
    @Body() body: { name: string; email: string; password: string; role: AdminRole },
  ) {
    return this.adminService.createAdmin(req.user, body);
  }

  // ✅ GET /admins/:id → جلب أدمن واحد (OWNER, MANAGER, SUPERVISOR)
  @Get(':id')
  @Roles('OWNER', 'MANAGER', 'SUPERVISOR')
  async getAdminById(@Request() req: JwtRequest, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.getAdminById(req.user, id);
  }

  // ✅ PUT /admins/:id → تحديث أدمن (OWNER فقط)
  @Put(':id')
  @Roles('OWNER')
  async updateAdmin(
    @Request() req: JwtRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<{ name: string; email: string; password: string; role: AdminRole }>,
  ) {
    return this.adminService.updateAdmin(req.user, id, body);
  }

  // ✅ DELETE /admins/:id → حذف أدمن (OWNER فقط)
  @Delete(':id')
  @Roles('OWNER')
  async deleteAdmin(@Request() req: JwtRequest, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteAdmin(req.user, id);
  }

  // ✅ GET /admins/reports → تقارير بسيطة (SUPERVISOR + MANAGER + OWNER)
  @Get('reports')
  @Roles('SUPERVISOR', 'MANAGER', 'OWNER')
  async getReports(@Request() req: JwtRequest) {
    return this.adminService.getReports(req.user);
  }

  // ✅ NEW: GET /admins/overview-kpis → KPIs عامة (زيارات + placeholders)
  // استخدم period=today|7d|30d أو from/to (YYYY-MM-DD)
  @Get('overview-kpis')
  @Roles('SUPERVISOR', 'MANAGER', 'OWNER')
  async getOverviewKpis(
    @Request() req: JwtRequest,
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
}
