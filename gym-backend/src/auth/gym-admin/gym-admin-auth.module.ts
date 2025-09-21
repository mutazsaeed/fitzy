import { Module } from '@nestjs/common';
import { GymAdminAuthController } from './gym-admin-auth.controller';
import { GymAdminAuthService } from './gym-admin-auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
  ],
  controllers: [GymAdminAuthController],
  providers: [GymAdminAuthService, PrismaService],
})
export class GymAdminAuthModule {}
