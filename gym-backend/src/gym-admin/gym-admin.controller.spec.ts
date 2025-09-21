import { Test, TestingModule } from '@nestjs/testing';
import { GymAdminController } from './gym-admin.controller';

describe('GymAdminController', () => {
  let controller: GymAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GymAdminController],
    }).compile();

    controller = module.get<GymAdminController>(GymAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
