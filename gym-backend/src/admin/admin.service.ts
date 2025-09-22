/* eslint-disable prettier/prettier */
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ReportingService } from '../reporting/reporting.service';
import { AdminOverviewKpiDto } from '../reporting/dto/admin-overview-kpi.dto';

// أنواع مساعدة تمنع any
type AdminCreateInput = { name: string; email: string; password: string; role: AdminRole };
type AdminUpdateInput = { name?: string; email?: string; password?: string; role?: AdminRole };

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private reporting: ReportingService,
  ) {}

  // Sets للوضوح وتفادي أخطاء union الضيقة
  private static readonly OWNER_MANAGER = new Set<AdminRole>([
    AdminRole.OWNER,
    AdminRole.MANAGER,
  ]);
  private static readonly VIEW_REPORTS = new Set<AdminRole>([
    AdminRole.SUPERVISOR,
    AdminRole.MANAGER,
    AdminRole.OWNER,
  ]);

  // ✅ جلب كل الأدمنز (OWNER و MANAGER فقط)
  async getAllAdmins(currentAdmin: { role: AdminRole }) {
    if (!AdminService.OWNER_MANAGER.has(currentAdmin.role)) {
      throw new ForbiddenException('غير مسموح لك بعرض قائمة الأدمنز');
    }
    return await this.prisma.admin.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
  }

  // ✅ إنشاء أدمن جديد (OWNER فقط) + تشفير كلمة المرور
  async createAdmin(currentAdmin: { role: AdminRole }, data: AdminCreateInput) {
    if (currentAdmin.role !== AdminRole.OWNER) {
      throw new ForbiddenException('فقط المالك يمكنه إضافة أدمن جديد');
    }
    const hashed = await bcrypt.hash(data.password, 10);
    return await this.prisma.admin.create({
      data: { ...data, password: hashed },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
  }

  // ✅ جلب أدمن واحد بالـ ID
  async getAdminById(currentAdmin: { role: AdminRole }, id: number) {
    if (
      !(
        currentAdmin.role === AdminRole.OWNER ||
        currentAdmin.role === AdminRole.MANAGER ||
        currentAdmin.role === AdminRole.SUPERVISOR
      )
    ) {
      throw new ForbiddenException('لا تملك صلاحية لعرض بيانات هذا الأدمن');
    }
    return await this.prisma.admin.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
  }

  // ✅ تحديث أدمن (OWNER فقط) + تشفير إذا أُرسلت كلمة مرور جديدة
  async updateAdmin(currentAdmin: { role: AdminRole }, id: number, data: AdminUpdateInput) {
    if (currentAdmin.role !== AdminRole.OWNER) {
      throw new ForbiddenException('فقط المالك يمكنه تعديل بيانات الأدمن');
    }

    const updateData: AdminUpdateInput = { ...data };
    if (typeof data.password === 'string' && data.password.length > 0) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return await this.prisma.admin.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
  }

  // ✅ حذف أدمن (OWNER فقط)
  async deleteAdmin(currentAdmin: { role: AdminRole }, id: number) {
    if (currentAdmin.role !== AdminRole.OWNER) {
      throw new ForbiddenException('فقط المالك يمكنه حذف الأدمن');
    }
    return await this.prisma.admin.delete({
      where: { id },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
  }

  // ✅ تقارير بسيطة (SUPERVISOR + MANAGER + OWNER)
  async getReports(currentAdmin: { role: AdminRole }) {
    if (!AdminService.VIEW_REPORTS.has(currentAdmin.role)) {
      throw new ForbiddenException('غير مسموح لك بالاطلاع على التقارير');
    }
    return { totalAdmins: await this.prisma.admin.count() };
  }

  // ✅ KPIs للداشبورد العام (Admin/Owner)
  async getOverviewKpis(
    currentAdmin: { role: AdminRole },
    query: { period?: 'today' | '7d' | '30d'; from?: string; to?: string },
  ): Promise<AdminOverviewKpiDto> {
    if (!AdminService.VIEW_REPORTS.has(currentAdmin.role)) {
      throw new ForbiddenException('غير مسموح لك بالاطلاع على لوحة المؤشرات');
    }
    return await this.reporting.getPlatformOverview({
      period: query.period,
      from: query.from,
      to: query.to,
    });
  }
}
