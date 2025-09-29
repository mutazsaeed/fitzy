import { Test, TestingModule } from '@nestjs/testing';
import { GymAdminController } from './gym-admin.controller';
import { GymAdminService } from './gym-admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GymAdminReportsService } from '../reporting/services/gym-admin-reports.service';

describe('GymAdminController', () => {
  let controller: GymAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule], // يوفّر PrismaService
      controllers: [GymAdminController],
      providers: [GymAdminService, GymAdminReportsService],
    }).compile();

    controller = module.get<GymAdminController>(GymAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
