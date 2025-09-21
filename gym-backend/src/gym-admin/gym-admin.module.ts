import { Module } from '@nestjs/common';
import { GymAdminController } from './gym-admin.controller';
import { GymAdminService } from './gym-admin.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [GymAdminController],
  providers: [GymAdminService, PrismaService],
  exports: [GymAdminService],
})
export class GymAdminModule {}
