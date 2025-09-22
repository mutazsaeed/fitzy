import { Test, TestingModule } from '@nestjs/testing';
import { GymAdminController } from './gym-admin.controller';
import { GymAdminService } from './gym-admin.service';
import { ReportingService } from '../reporting/reporting.service';
import { PrismaModule } from '../prisma/prisma.module';

describe('GymAdminController', () => {
  let controller: GymAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule], // يوفّر PrismaService للخدمات
      controllers: [GymAdminController],
      providers: [GymAdminService, ReportingService],
    }).compile();

    controller = module.get<GymAdminController>(GymAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
