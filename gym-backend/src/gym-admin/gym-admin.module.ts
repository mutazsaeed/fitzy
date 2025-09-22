import { Module } from '@nestjs/common';
import { GymAdminController } from './gym-admin.controller';
import { GymAdminService } from './gym-admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReportingModule } from '../reporting/reporting.module';

@Module({
  imports: [ReportingModule],
  controllers: [GymAdminController],
  providers: [GymAdminService, PrismaService],
  exports: [GymAdminService],
})
export class GymAdminModule {}
