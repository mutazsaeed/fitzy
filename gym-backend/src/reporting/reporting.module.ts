import { Module } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // ✅ نوفر PrismaService داخل هذا المودول
  providers: [ReportingService],
  exports: [ReportingService],
})
export class ReportingModule {}
