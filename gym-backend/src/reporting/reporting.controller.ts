import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

// DTOs
import { PlanUsageQueryDto } from './dto/plan-usage.query.dto';
import { GymHourlyHeatmapQueryDto } from './dto/gym-hourly-heatmap.dto';
import { GymBranchDailyQueryDto } from './dto/gym-branch-daily.dto';
import { ReconciliationQueryDto } from './dto/reconciliation.query.dto';

// -------------------------------
// Admin/Owner endpoints
// -------------------------------
@Controller('reports/admin')
@UseGuards(JwtAuthGuard)
export class ReportingController {
  constructor(private readonly reporting: ReportingService) {}

  // تقرير استعمال الباقات (Step 10)
  @Get('plan-usage')
  async getPlanUsage(@Query() q: PlanUsageQueryDto) {
    return this.reporting.getPlanUsage(q);
  }

  // كشف المطابقة الشهري لكل الأندية (Step 12)
  @Get('reconciliation')
  async getMonthlyReconciliation(@Query() q: ReconciliationQueryDto) {
    return this.reporting.getMonthlyReconciliation(q);
  }
}

// -------------------------------
// Gym Admin endpoints (Step 11)
// -------------------------------
@Controller('gym-admins/reports')
@UseGuards(JwtAuthGuard)
export class GymAdminReportingController {
  constructor(private readonly reporting: ReportingService) {}

  // خريطة الزيارات بالساعات (Heatmap)
  @Get('hourly-heatmap')
  async getHourlyHeatmap(@Query() q: GymHourlyHeatmapQueryDto) {
    return this.reporting.getGymHourlyHeatmap(q);
  }

  // الزيارات اليومية لكل فرع (Line/Compare)
  @Get('branch-daily')
  async getBranchDaily(@Query() q: GymBranchDailyQueryDto) {
    return this.reporting.getGymBranchDaily(q);
  }
}
