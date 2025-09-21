/* eslint-disable prettier/prettier */
import { Controller, Post, Body } from '@nestjs/common';
import { GymAdminAuthService } from './gym-admin-auth.service';
import { GymAdminRole } from '@prisma/client';

@Controller('auth/gym-admin')
export class GymAdminAuthController {
  constructor(private readonly gymAdminAuthService: GymAdminAuthService) {}

  // ✅ تسجيل الدخول لمشرف/موظف استقبال
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
  ) {
    return this.gymAdminAuthService.login(body.email, body.password);
  }

  // ✅ تسجيل حساب جديد (لاحقًا: فقط يقدر الـ OWNER أو MANAGER ينشئ)
  @Post('register')
  async register(
    @Body()
    body: { name: string; email: string; password: string; role: GymAdminRole; gymId: number },
  ) {
    return this.gymAdminAuthService.register(body);
  }
}
