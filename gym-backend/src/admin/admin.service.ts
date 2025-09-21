/* eslint-disable prettier/prettier */
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// أنواع مساعدة تمنع any
type AdminCreateInput = { name: string; email: string; password: string; role: AdminRole };
type AdminUpdateInput = { name?: string; email?: string; password?: string; role?: AdminRole };

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ✅ جلب كل الأدمنز (OWNER و MANAGER فقط)
  async getAllAdmins(currentAdmin: { role: AdminRole }) {
    if (!['OWNER', 'MANAGER'].includes(currentAdmin.role)) {
      throw new ForbiddenException('غير مسموح لك بعرض قائمة الأدمنز');
    }
    return this.prisma.admin.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
  }

  // ✅ إنشاء أدمن جديد (OWNER فقط) + تشفير كلمة المرور
  async createAdmin(currentAdmin: { role: AdminRole }, data: AdminCreateInput) {
    if (currentAdmin.role !== 'OWNER') {
      throw new ForbiddenException('فقط المالك يمكنه إضافة أدمن جديد');
    }

    const hashed = await bcrypt.hash(data.password, 10);

    return this.prisma.admin.create({
      data: { ...data, password: hashed },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
  }

  // ✅ جلب أدمن واحد بالـ ID
  async getAdminById(currentAdmin: { role: AdminRole }, id: number) {
    if (!['OWNER', 'MANAGER', 'SUPERVISOR'].includes(currentAdmin.role)) {
      throw new ForbiddenException('لا تملك صلاحية لعرض بيانات هذا الأدمن');
    }
    return this.prisma.admin.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
  }

  // ✅ تحديث أدمن (OWNER فقط) + تشفير إذا أُرسلت كلمة مرور جديدة (بدون any)
  async updateAdmin(currentAdmin: { role: AdminRole }, id: number, data: AdminUpdateInput) {
    if (currentAdmin.role !== 'OWNER') {
      throw new ForbiddenException('فقط المالك يمكنه تعديل بيانات الأدمن');
    }

    const updateData: AdminUpdateInput = { ...data };

    if (typeof data.password === 'string' && data.password.length > 0) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.admin.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
  }

  // ✅ حذف أدمن (OWNER فقط)
  async deleteAdmin(currentAdmin: { role: AdminRole }, id: number) {
    if (currentAdmin.role !== 'OWNER') {
      throw new ForbiddenException('فقط المالك يمكنه حذف الأدمن');
    }
    return this.prisma.admin.delete({
      where: { id },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
  }

  // ✅ تقارير (SUPERVISOR + MANAGER + OWNER)
  async getReports(currentAdmin: { role: AdminRole }) {
    if (!['SUPERVISOR', 'MANAGER', 'OWNER'].includes(currentAdmin.role)) {
      throw new ForbiddenException('غير مسموح لك بالاطلاع على التقارير');
    }
    return { totalAdmins: await this.prisma.admin.count() };
  }
}
