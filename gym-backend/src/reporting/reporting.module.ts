import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../common/cache/cache.module';

import {
  ReportingController,
  GymAdminReportingController,
  UserReportingController,
} from './reporting.controller';

import { UserReportsService } from './services/user-reports.service';
import { GymAdminReportsService } from './services/gym-admin-reports.service';
import { AnalyticsReportsService } from './services/analytics-reports.service';
import { ReconciliationService } from './services/reconciliation.service';
import { ExportsService } from './services/exports.service';
import { ReportingPermissionGuard } from './guards/reporting-permission.guard';

@Module({
  imports: [PrismaModule, AuthModule, CacheModule],
  controllers: [
    ReportingController,
    GymAdminReportingController,
    UserReportingController,
  ],
  providers: [
    UserReportsService,
    GymAdminReportsService,
    AnalyticsReportsService,
    ReconciliationService,
    ExportsService,
    ReportingPermissionGuard,
  ],
  exports: [
    UserReportsService,
    GymAdminReportsService,
    AnalyticsReportsService,
    ReconciliationService,
    ExportsService,
  ],
})
export class ReportingModule {}
