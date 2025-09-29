/* eslint-disable prettier/prettier */
// cspell:disable
import { Controller, Get, Query, Param } from '@nestjs/common';

// Services (new split)
import { AnalyticsReportsService } from './services/analytics-reports.service';
import { GymAdminReportsService } from './services/gym-admin-reports.service';
import { UserReportsService } from './services/user-reports.service';
import { ReconciliationService } from './services/reconciliation.service';
import { ExportsService } from './services/exports.service';

// DTOs used by endpoints
import { AdminOverviewKpiDto } from './dto/admin-overview-kpi.dto';

import { TopGymsQueryDto } from './dto/top-gyms.query.dto';
import { TopGymsResponse } from './dto/top-gyms.response.dto';

import { PlanUsageQueryDto } from './dto/plan-usage.query.dto';
import { PlanUsageResponseDto } from './dto/plan-usage.response.dto';

import {
  GymHourlyHeatmapQueryDto,
  GymHourlyHeatmapResponseDto,
} from './dto/gym-hourly-heatmap.dto';

import {
  GymBranchDailyQueryDto,
  GymBranchDailyResponseDto,
} from './dto/gym-branch-daily.dto';

import { ReconciliationQueryDto } from './dto/reconciliation.query.dto';
import { ReconciliationResponseDto } from './dto/reconciliation.response.dto';

import { UserVisitsQueryDto } from './dto/user-visits.query.dto';
import { UserVisitsResponseDto } from './dto/user-visits.response.dto';

import { GymAdminTodayReportDto } from './dto/gym-admin-today-report.dto';
import { GymAdminRangeReportDto } from './dto/gym-admin-range-report.dto';
import { GymAdminTopUsersDto } from './dto/gym-admin-top-users.dto';

@Controller('reporting')
export class ReportingController {
  constructor(
    private readonly analytics: AnalyticsReportsService,
    private readonly reconciliation: ReconciliationService,
    private readonly exportsService: ExportsService,
  ) {}

  // -------- Platform/Owner analytics --------

  @Get('overview')
  getPlatformOverview(
    @Query() query: { period?: 'today' | '7d' | '30d'; from?: string; to?: string },
  ): Promise<AdminOverviewKpiDto> {
    return this.analytics.getPlatformOverview(query);
  }

  @Get('top-gyms')
  getTopGyms(@Query() query: TopGymsQueryDto): Promise<TopGymsResponse> {
    return this.analytics.getTopGyms(query);
  }

  @Get('plan-usage')
  getPlanUsage(@Query() query: PlanUsageQueryDto): Promise<PlanUsageResponseDto> {
    return this.analytics.getPlanUsage(query);
  }

  @Get('gym-hourly-heatmap')
  getGymHourlyHeatmap(@Query() q: GymHourlyHeatmapQueryDto): Promise<GymHourlyHeatmapResponseDto> {
    return this.analytics.getGymHourlyHeatmap(q);
  }

  @Get('gym-branch-daily')
  getGymBranchDaily(@Query() q: GymBranchDailyQueryDto): Promise<GymBranchDailyResponseDto> {
    return this.analytics.getGymBranchDaily(q);
  }

  // -------- Reconciliation (all clubs) --------

  @Get('reconciliation')
  getMonthlyReconciliation(
    @Query() q: ReconciliationQueryDto,
  ): Promise<ReconciliationResponseDto> {
    return this.reconciliation.getMonthlyReconciliation(q);
  }

  @Get('reconciliation/export/csv')
  async exportMonthlyReconciliationCsv(
    @Query() q: ReconciliationQueryDto,
  ): Promise<{ filename: string; mime: string; buffer: Buffer }> {
    return this.exportsService.exportMonthlyReconciliationCsv(q);
  }

  @Get('reconciliation/export/pdf')
  async exportMonthlyReconciliationPdf(
    @Query() q: ReconciliationQueryDto,
  ): Promise<{ filename: string; mime: string; buffer: Buffer }> {
    return this.exportsService.exportMonthlyReconciliationPdf(q);
  }
}

@Controller('reporting/gym-admin')
export class GymAdminReportingController {
  constructor(private readonly gymAdmin: GymAdminReportsService) {}

  @Get(':gymId/today')
  getGymAdminToday(
    @Param('gymId') gymIdStr: string,
    @Query('branchId') branchIdStr?: string,
  ): Promise<GymAdminTodayReportDto> {
    const gymId = Number(gymIdStr);
    const branchId = branchIdStr !== undefined ? Number(branchIdStr) : undefined;
    return this.gymAdmin.getGymAdminToday({ gymId, branchId });
  }

  @Get(':gymId/range')
  getGymAdminRange(
    @Param('gymId') gymIdStr: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('branchId') branchIdStr?: string,
  ): Promise<GymAdminRangeReportDto> {
    const gymId = Number(gymIdStr);
    const branchId = branchIdStr !== undefined ? Number(branchIdStr) : undefined;
    return this.gymAdmin.getGymAdminRange({ gymId, from, to, branchId });
  }

  @Get(':gymId/top-users')
  getGymAdminTopUsers(
    @Param('gymId') gymIdStr: string,
    @Query('limit') limitStr?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchIdStr?: string,
  ): Promise<GymAdminTopUsersDto> {
    const gymId = Number(gymIdStr);
    const limit = limitStr !== undefined ? Number(limitStr) : undefined;
    const branchId = branchIdStr !== undefined ? Number(branchIdStr) : undefined;
    return this.gymAdmin.getGymAdminTopUsers({ gymId, limit, from, to, branchId });
  }
}

@Controller('reporting/user')
export class UserReportingController {
  constructor(private readonly userReports: UserReportsService) {}

  @Get(':userId/visits')
  getMyVisits(
    @Param('userId') userIdStr: string,
    @Query() q: UserVisitsQueryDto,
  ): Promise<UserVisitsResponseDto> {
    const userId = Number(userIdStr);
    return this.userReports.getMyVisits(userId, q);
  }
}
