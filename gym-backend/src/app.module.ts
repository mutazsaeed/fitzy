import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module'; // ✅ نخلي Prisma كـ Module
import { SubscriptionModule } from './subscription/subscription.module';
import { UserModule } from './user/user.module';
import { GymModule } from './gym/gym.module';
import { VisitsModule } from './visits/visits.module';
import { QrModule } from './qr/qr.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { GymAdminModule } from './gym-admin/gym-admin.module';

@Module({
  imports: [
    PrismaModule, // ✅ نخلي Prisma Module مش service عشان best practice
    SubscriptionModule,
    UserModule,
    GymModule,
    VisitsModule,
    QrModule,
    AuthModule,
    AdminModule, // ✅ مسؤولين (Owner / Manager / Supervisor)
    GymAdminModule, // ✅ مشرفي الأندية (Supervisor / Receptionist)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
