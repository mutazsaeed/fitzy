import { Test, TestingModule } from '@nestjs/testing';
import { GymService } from './gym.service';
import { PrismaModule } from '../prisma/prisma.module';

describe('GymService', () => {
  let service: GymService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule], // يوفر PrismaService للـ GymService
      providers: [GymService],
    }).compile();

    service = module.get<GymService>(GymService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
