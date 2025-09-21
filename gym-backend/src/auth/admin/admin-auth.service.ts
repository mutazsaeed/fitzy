/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * ملاحظة مهمة:
   * حالياً إنشاء الأدمن في AdminService لا يشفّر كلمة المرور (plain text).
   * هذا الميثود يدعم الحالتين:
   *  - إن كانت القيم مخزّنة مشفّرة (bcrypt) → نستخدم compare
   *  - إن كانت نصّية عادية → نقارن مباشرة كمرحلة انتقالية
   * لاحقاً لما نفعّل تشفير كلمة المرور عند الإنشاء، سيستمر هذا الكود بالعمل بدون تغيير.
   */
  async login(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    let isValid = false;

    // إذا كانت كلمة المرور في الداتابيز تبدو كـ bcrypt hash
    if (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$') || admin.password.startsWith('$2y$')) {
      isValid = await bcrypt.compare(password, admin.password);
    } else {
      // انتقالياً: مقارنة نصية مباشرة (إلى أن نفعّل التشفير عند الإنشاء)
      isValid = password === admin.password;
    }

    if (!isValid) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const payload: { id: number; role: AdminRole; type: 'ADMIN' } = {
      id: admin.id,
      role: admin.role,
      type: 'ADMIN',
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    };
  }
}
