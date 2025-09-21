import { Controller, Post, Body } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { IsEmail, IsNotEmpty } from 'class-validator';

// DTO محلي بسيط لتفادي any
class AdminLoginDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  password!: string;
}

// نوع الاستجابة لتفادي no-unsafe-return
type AdminLoginResponse = {
  access_token: string;
  admin: {
    id: number;
    name: string;
    email: string;
    role: string; // AdminRole as string
  };
};

@Controller('auth/admin')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  // ✅ تسجيل الدخول للأدمن (OWNER / MANAGER / SUPERVISOR)
  @Post('login')
  async login(@Body() body: AdminLoginDto): Promise<AdminLoginResponse> {
    // إضافة await يحل require-await
    const result = await this.adminAuthService.login(body.email, body.password);
    return result;
  }
}
