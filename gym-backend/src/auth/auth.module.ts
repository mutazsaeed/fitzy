import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { GymAdminAuthModule } from './gym-admin/gym-admin-auth.module';
import { AdminAuthModule } from './admin/admin-auth.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'secretKey', // fallback لو المتغير مو موجود
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
    }),
    GymAdminAuthModule,
    AdminAuthModule, // 👈 نستدعي المودل فقط
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService], // 👈 للتصدير لو نحتاجه بغير مكان
})
export class AuthModule {}
