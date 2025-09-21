/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { GymAdminRole } from '@prisma/client';

@Injectable()
export class GymAdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ✅ تسجيل الدخول
  async login(email: string, password: string) {
    const admin = await this.prisma.gymAdmin.findUnique({ where: { email } });
    if (!admin) throw new UnauthorizedException('بيانات الدخول غير صحيحة');

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) throw new UnauthorizedException('بيانات الدخول غير صحيحة');

    const payload = { id: admin.id, role: admin.role, gymId: admin.gymId, type: 'GYM_ADMIN' };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  // ✅ تسجيل مشرف/موظف استقبال جديد
  async register(data: { name: string; email: string; password: string; role: GymAdminRole; gymId: number }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.gymAdmin.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }
}
