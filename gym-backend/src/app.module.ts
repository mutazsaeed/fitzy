import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { UserModule } from './user/user.module';
import { GymModule } from './gym/gym.module';
import { VisitsModule } from './visits/visits.module';
import { QrModule } from './qr/qr.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { GymAdminModule } from './gym-admin/gym-admin.module';
import { ReportingModule } from './reporting/reporting.module'; // ⬅️ جديد

@Module({
  imports: [
    PrismaModule,
    SubscriptionModule,
    UserModule,
    GymModule,
    VisitsModule,
    QrModule,
    AuthModule,
    AdminModule,
    GymAdminModule,
    ReportingModule, // ⬅️ أضفها هنا لتفعّل /reports/*
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
