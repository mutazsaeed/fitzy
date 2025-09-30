import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  ForbiddenException,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';

// Services (split)
import { AnalyticsReportsService } from './services/analytics-reports.service';
import { GymAdminReportsService } from './services/gym-admin-reports.service';
import { UserReportsService } from './services/user-reports.service';
import { ReconciliationService } from './services/reconciliation.service';
import { ExportsService } from './services/exports.service';

// Auth / RBAC
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ReportingPermissionGuard } from './guards/reporting-permission.guard';
import { ReportingPermissionRequired } from './decorators/permission.decorator';
import { ReportingPermission } from './reporting.policy';

// DTOs
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

// Step #14
import { UserSubscriptionRemainingQueryDto } from './dto/user-subscription-remaining.query.dto';
import { UserSubscriptionRemainingResponseDto } from './dto/user-subscription-remaining.response.dto';

@UseGuards(JwtAuthGuard, ReportingPermissionGuard)
@Controller('reporting')
export class ReportingController {
  constructor(
    private readonly analytics: AnalyticsReportsService,
    private readonly reconciliation: ReconciliationService,
    private readonly exportsService: ExportsService,
  ) {}

  // Platform analytics
  @ReportingPermissionRequired(ReportingPermission.PLATFORM_VIEW)
  @Get('overview')
  getPlatformOverview(
    @Query()
    query: {
      period?: 'today' | '7d' | '30d';
      from?: string;
      to?: string;
    },
  ): Promise<AdminOverviewKpiDto> {
    return this.analytics.getPlatformOverview(query);
  }

  @ReportingPermissionRequired(ReportingPermission.PLATFORM_VIEW)
  @Get('top-gyms')
  getTopGyms(@Query() query: TopGymsQueryDto): Promise<TopGymsResponse> {
    return this.analytics.getTopGyms(query);
  }

  @ReportingPermissionRequired(ReportingPermission.PLATFORM_VIEW)
  @Get('plan-usage')
  getPlanUsage(
    @Query() query: PlanUsageQueryDto,
  ): Promise<PlanUsageResponseDto> {
    return this.analytics.getPlanUsage(query);
  }

  @ReportingPermissionRequired(ReportingPermission.PLATFORM_VIEW)
  @Get('gym-hourly-heatmap')
  getGymHourlyHeatmap(
    @Query() q: GymHourlyHeatmapQueryDto,
  ): Promise<GymHourlyHeatmapResponseDto> {
    return this.analytics.getGymHourlyHeatmap(q);
  }

  @ReportingPermissionRequired(ReportingPermission.PLATFORM_VIEW)
  @Get('gym-branch-daily')
  getGymBranchDaily(
    @Query() q: GymBranchDailyQueryDto,
  ): Promise<GymBranchDailyResponseDto> {
    return this.analytics.getGymBranchDaily(q);
  }

  // Reconciliation (platform scope)
  @ReportingPermissionRequired(ReportingPermission.PLATFORM_VIEW)
  @Get('reconciliation')
  getMonthlyReconciliation(
    @Query() q: ReconciliationQueryDto,
  ): Promise<ReconciliationResponseDto> {
    return this.reconciliation.getMonthlyReconciliation(q);
  }

  @ReportingPermissionRequired(ReportingPermission.PLATFORM_EXPORT)
  @Get('reconciliation/export/csv')
  async exportMonthlyReconciliationCsv(
    @Query() q: ReconciliationQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const payload = await this.exportsService.exportMonthlyReconciliationCsv(q);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${payload.filename}"`,
    );
    res.setHeader('Content-Type', payload.mime);
    res.send(payload.buffer);
  }

  @ReportingPermissionRequired(ReportingPermission.PLATFORM_EXPORT)
  @Get('reconciliation/export/pdf')
  async exportMonthlyReconciliationPdf(
    @Query() q: ReconciliationQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const payload = await this.exportsService.exportMonthlyReconciliationPdf(q);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${payload.filename}"`,
    );
    res.setHeader('Content-Type', payload.mime);
    res.send(payload.buffer);
  }
}

@UseGuards(JwtAuthGuard, ReportingPermissionGuard)
@Controller('reporting/gym-admin')
export class GymAdminReportingController {
  constructor(private readonly gymAdmin: GymAdminReportsService) {}

  @ReportingPermissionRequired(ReportingPermission.GYM_VIEW)
  @Get(':gymId/today')
  getGymAdminToday(
    @Param('gymId') gymIdStr: string,
    @Query('branchId') branchIdStr?: string,
  ): Promise<GymAdminTodayReportDto> {
    const gymId = Number(gymIdStr);
    const branchId =
      branchIdStr !== undefined ? Number(branchIdStr) : undefined;
    return this.gymAdmin.getGymAdminToday({
      gymId,
      branchId,
    });
  }

  @ReportingPermissionRequired(ReportingPermission.GYM_VIEW)
  @Get(':gymId/range')
  getGymAdminRange(
    @Param('gymId') gymIdStr: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('branchId') branchIdStr?: string,
  ): Promise<GymAdminRangeReportDto> {
    const gymId = Number(gymIdStr);
    const branchId =
      branchIdStr !== undefined ? Number(branchIdStr) : undefined;
    return this.gymAdmin.getGymAdminRange({
      gymId,
      from,
      to,
      branchId,
    });
  }

  @ReportingPermissionRequired(ReportingPermission.GYM_VIEW)
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
    const branchId =
      branchIdStr !== undefined ? Number(branchIdStr) : undefined;
    return this.gymAdmin.getGymAdminTopUsers({
      gymId,
      limit,
      from,
      to,
      branchId,
    });
  }
}

type JwtUser = { userId: number; role?: string; gymId?: number; type?: string };

@UseGuards(JwtAuthGuard, ReportingPermissionGuard)
@Controller('reporting/user')
export class UserReportingController {
  constructor(private readonly userReports: UserReportsService) {}

  @ReportingPermissionRequired(ReportingPermission.USER_SELF_VIEW)
  @Get(':userId/visits')
  getMyVisits(
    @Param('userId') userIdStr: string,
    @Req() req: Request & { user?: JwtUser },
    @Query() q: UserVisitsQueryDto,
  ): Promise<UserVisitsResponseDto> {
    const userId = Number(userIdStr);
    const authUserId = Number(req.user?.userId);
    if (!Number.isFinite(authUserId) || authUserId !== userId) {
      throw new ForbiddenException('You can only view your own visits');
    }
    return this.userReports.getMyVisits(userId, q);
  }

  @ReportingPermissionRequired(ReportingPermission.USER_SELF_VIEW)
  @Get(':userId/subscription/remaining')
  getMySubscriptionRemaining(
    @Param('userId') userIdStr: string,
    @Req() req: Request & { user?: JwtUser },
    @Query() q: UserSubscriptionRemainingQueryDto,
  ): Promise<UserSubscriptionRemainingResponseDto> {
    const userId = Number(userIdStr);
    const authUserId = Number(req.user?.userId);
    if (!Number.isFinite(authUserId) || authUserId !== userId) {
      throw new ForbiddenException(
        'You can only view your own subscription remaining',
      );
    }
    return this.userReports.getMySubscriptionRemaining(userId, q);
  }
}
