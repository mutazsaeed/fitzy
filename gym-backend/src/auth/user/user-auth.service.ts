/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

type JwtUserPayload = {
  sub: number;       // للمكتبات/حراس تقرأ sub
  userId: number;    // لتوحيد القراءة في باقي النظام
  type: 'USER';
};

@Injectable()
export class UserAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const looksHashed =
      user.password.startsWith('$2a$') ||
      user.password.startsWith('$2b$') ||
      user.password.startsWith('$2y$');

    const ok = looksHashed
      ? await bcrypt.compare(password, user.password)
      : password === user.password;

    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const payload: JwtUserPayload = { sub: user.id, userId: user.id, type: 'USER' };
    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }
}
