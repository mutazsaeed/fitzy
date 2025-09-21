import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GymAdminRole } from '@prisma/client';

@Injectable()
export class GymAdminService {
  constructor(private prisma: PrismaService) {}

  // ✅ جلب زيارات النادي (فقط GYM_SUPERVISOR)
  async getVisits(currentAdmin: { role: GymAdminRole; gymId: number }) {
    if (currentAdmin.role !== GymAdminRole.GYM_SUPERVISOR) {
      throw new ForbiddenException('فقط المشرف يمكنه عرض الزيارات');
    }
    return this.prisma.visit.findMany({
      where: { gymId: currentAdmin.gymId },
      include: { user: true },
    });
  }

  // ✅ تقارير الحضور (فقط GYM_SUPERVISOR)
  async getReports(currentAdmin: { role: GymAdminRole; gymId: number }) {
    if (currentAdmin.role !== GymAdminRole.GYM_SUPERVISOR) {
      throw new ForbiddenException('فقط المشرف يمكنه عرض التقارير');
    }
    const totalVisits = await this.prisma.visit.count({
      where: { gymId: currentAdmin.gymId },
    });
    const uniqueUsers = await this.prisma.visit.groupBy({
      by: ['userId'],
      where: { gymId: currentAdmin.gymId },
    });
    return {
      totalVisits,
      uniqueUsers: uniqueUsers.length,
    };
  }

  // ✅ تسجيل زيارة عبر QR (فقط RECEPTIONIST)
  async scanQr(
    currentAdmin: { role: GymAdminRole; gymId: number },
    userId: number,
  ) {
    if (currentAdmin.role !== GymAdminRole.RECEPTIONIST) {
      throw new ForbiddenException('فقط موظف الاستقبال يمكنه تسجيل الزيارة');
    }
    return this.prisma.visit.create({
      data: {
        userId,
        gymId: currentAdmin.gymId,
        visitDate: new Date(),
        method: 'QR',
      },
    });
  }
}
