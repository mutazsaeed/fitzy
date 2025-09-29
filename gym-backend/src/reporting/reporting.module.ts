/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

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

@Module({
  imports: [PrismaModule],
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
