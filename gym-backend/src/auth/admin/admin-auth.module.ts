import { Module } from '@nestjs/common';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      // الـ JwtModule عندك مُسجل global في AuthModule، لكن التسجيل هنا آمن ومتوافق
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, PrismaService],
  exports: [AdminAuthService],
})
export class AdminAuthModule {}
