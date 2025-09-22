/* eslint-disable prettier/prettier */
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GymAdminRole } from '@prisma/client';
import { ReportingService } from '../reporting/reporting.service';

@Injectable()
export class GymAdminService {
  constructor(
    private prisma: PrismaService,
    private reporting: ReportingService,
  ) {}

  /**
   * يتحقق أن الفرع يتبع نفس النادي للمشرف وأنه مخوّل له (إن كانت له تعيينات محددة).
   * القاعدة: لو لدى المشرف تعيينات فروع (GymAdminBranch) → يجب أن يكون الفرع ضمنها.
   * لو لا توجد تعيينات → يُعتبر مخوّلاً لكل فروع ناديه.
   */
  private async assertBranchAccess(
    currentAdmin: { id: number; gymId: number },
    branchId?: number,
  ): Promise<number | undefined> {
    if (!branchId) return undefined;

    // 1) تحقق أن الفرع موجود ويتبع نفس الـGym ومفعّل
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, gymId: currentAdmin.gymId, isActive: true },
      select: { id: true },
    });
    if (!branch) {
      throw new ForbiddenException('الفرع غير تابع لنفس النادي أو غير مفعّل');
    }

    // 2) تحقق الصلاحية حسب تعيينات المشرف
    const assignmentsCount = await this.prisma.gymAdminBranch.count({
      where: { gymAdminId: currentAdmin.id },
    });
    if (assignmentsCount > 0) {
      const allowed = await this.prisma.gymAdminBranch.findUnique({
        where: { gymAdminId_branchId: { gymAdminId: currentAdmin.id, branchId } },
        select: { branchId: true },
      });
      if (!allowed) {
        throw new ForbiddenException('غير مخوّل للوصول إلى هذا الفرع');
      }
    }

    return branch.id;
  }

  // ✅ تقرير اليوم (فقط GYM_SUPERVISOR)
  async getTodayReport(
    currentAdmin: { id: number; role: GymAdminRole; gymId: number },
    opts: { branchId?: number } = {},
  ) {
    if (currentAdmin.role !== GymAdminRole.GYM_SUPERVISOR) {
      throw new ForbiddenException('فقط المشرف يمكنه عرض تقارير اليوم');
    }
    const branchId = await this.assertBranchAccess(currentAdmin, opts.branchId);
    return this.reporting.getGymAdminToday({
      gymId: currentAdmin.gymId,
      branchId,
    });
  }

  // ✅ تقرير مدى زمني (فقط GYM_SUPERVISOR)
  async getRangeReport(
    currentAdmin: { id: number; role: GymAdminRole; gymId: number },
    params: { from: string; to: string }, // YYYY-MM-DD
    opts: { branchId?: number } = {},
  ) {
    if (currentAdmin.role !== GymAdminRole.GYM_SUPERVISOR) {
      throw new ForbiddenException('فقط المشرف يمكنه عرض تقارير المدى الزمني');
    }
    const branchId = await this.assertBranchAccess(currentAdmin, opts.branchId);
    return this.reporting.getGymAdminRange({
      gymId: currentAdmin.gymId,
      from: params.from,
      to: params.to,
      branchId,
    });
  }

  // ✅ أفضل العملاء (آخر 30 يوم افتراضيًا أو ضمن مدى مرسل) — فقط GYM_SUPERVISOR
  async getTopUsersReport(
    currentAdmin: { id: number; role: GymAdminRole; gymId: number },
    params: { limit?: number; from?: string; to?: string },
    opts: { branchId?: number } = {},
  ) {
    if (currentAdmin.role !== GymAdminRole.GYM_SUPERVISOR) {
      throw new ForbiddenException('فقط المشرف يمكنه عرض أفضل العملاء');
    }
    const branchId = await this.assertBranchAccess(currentAdmin, opts.branchId);
    return this.reporting.getGymAdminTopUsers({
      gymId: currentAdmin.gymId,
      limit: params.limit,
      from: params.from,
      to: params.to,
      branchId,
    });
  }

  // ✅ جلب زيارات النادي (فقط GYM_SUPERVISOR) — (بدون فرع حالياً)
  async getVisits(currentAdmin: { role: GymAdminRole; gymId: number }) {
    if (currentAdmin.role !== GymAdminRole.GYM_SUPERVISOR) {
      throw new ForbiddenException('فقط المشرف يمكنه عرض الزيارات');
    }
    return this.prisma.visit.findMany({
      where: { gymId: currentAdmin.gymId },
      include: { user: true },
    });
  }

  // ✅ تقارير الحضور (قديمة، سنُزيلها لاحقًا)
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
