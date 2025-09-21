import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService], // نصدّر الخدمة عشان باقي الموديولات تستخدمها
})
export class PrismaModule {}
