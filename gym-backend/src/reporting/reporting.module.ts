/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportingService } from './reporting.service';
import { ReportingController, GymAdminReportingController } from './reporting.controller';

@Module({
  imports: [PrismaModule],
  providers: [ReportingService],
  controllers: [ReportingController, GymAdminReportingController],
  exports: [ReportingService],
})
export class ReportingModule {}
