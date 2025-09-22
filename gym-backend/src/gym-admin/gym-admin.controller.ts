import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GymAdminService } from './gym-admin.service';
import { GymAdminRole } from '@prisma/client';

interface JwtRequest extends Request {
  user: { id: number; role: GymAdminRole; gymId: number };
}

@Controller('gym-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GymAdminController {
  constructor(private readonly gymAdminService: GymAdminService) {}

  // ✅ GET /gym-admin/reports/today?branchId=123
  @Get('reports/today')
  @Roles(GymAdminRole.GYM_SUPERVISOR)
  async getToday(
    @Request() req: JwtRequest,
    @Query('branchId') branchId?: string,
  ) {
    const branchIdNum = branchId !== undefined ? Number(branchId) : undefined;
    if (
      branchId !== undefined &&
      (!Number.isFinite(branchIdNum!) || branchIdNum! <= 0)
    ) {
      throw new BadRequestException('branchId must be a positive number');
    }
    return this.gymAdminService.getTodayReport(req.user, {
      branchId: branchIdNum,
    });
  }

  // ✅ GET /gym-admin/reports/range?from=YYYY-MM-DD&to=YYYY-MM-DD[&branchId=123]
  @Get('reports/range')
  @Roles(GymAdminRole.GYM_SUPERVISOR)
  async getRange(
    @Request() req: JwtRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
  ) {
    if (!from || !to) {
      throw new BadRequestException('from and to are required as YYYY-MM-DD');
    }
    if (
      (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) ||
      (to && !/^\d{4}-\d{2}-\d{2}$/.test(to))
    ) {
      throw new BadRequestException('from/to must be YYYY-MM-DD');
    }
    const branchIdNum = branchId !== undefined ? Number(branchId) : undefined;
    if (
      branchId !== undefined &&
      (!Number.isFinite(branchIdNum!) || branchIdNum! <= 0)
    ) {
      throw new BadRequestException('branchId must be a positive number');
    }

    return this.gymAdminService.getRangeReport(
      req.user,
      { from, to },
      { branchId: branchIdNum },
    );
  }

  // ✅ GET /gym-admin/reports/top-users?limit=10[&from=YYYY-MM-DD&to=YYYY-MM-DD&branchId=123]
  @Get('reports/top-users')
  @Roles(GymAdminRole.GYM_SUPERVISOR)
  async getTopUsers(
    @Request() req: JwtRequest,
    @Query('limit') limit?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
  ) {
    const limitNum = limit ? Number(limit) : undefined;
    if (limit && (isNaN(limitNum!) || limitNum! <= 0)) {
      throw new BadRequestException('limit must be a positive number');
    }
    if (
      (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) ||
      (to && !/^\d{4}-\d{2}-\d{2}$/.test(to))
    ) {
      throw new BadRequestException('from/to must be YYYY-MM-DD if provided');
    }
    const branchIdNum = branchId !== undefined ? Number(branchId) : undefined;
    if (
      branchId !== undefined &&
      (!Number.isFinite(branchIdNum!) || branchIdNum! <= 0)
    ) {
      throw new BadRequestException('branchId must be a positive number');
    }

    return this.gymAdminService.getTopUsersReport(
      req.user,
      { limit: limitNum, from, to },
      { branchId: branchIdNum },
    );
  }

  // ✅ GET /gym-admin/visits → عرض زيارات النادي (GYM_SUPERVISOR فقط)
  @Get('visits')
  @Roles(GymAdminRole.GYM_SUPERVISOR)
  async getVisits(@Request() req: JwtRequest) {
    return this.gymAdminService.getVisits(req.user);
  }

  // ✅ GET /gym-admin/reports → (قديم) تجميع بسيط — سيُستبدل لاحقًا
  @Get('reports')
  @Roles(GymAdminRole.GYM_SUPERVISOR)
  async getReports(@Request() req: JwtRequest) {
    return this.gymAdminService.getReports(req.user);
  }

  // ✅ POST /gym-admin/scan → تسجيل زيارة QR (RECEPTIONIST فقط)
  @Post('scan')
  @Roles(GymAdminRole.RECEPTIONIST)
  async scanQr(@Request() req: JwtRequest, @Body() body: { userId: number }) {
    return this.gymAdminService.scanQr(req.user, body.userId);
  }
}
