/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// spell-check: disable
import {
  INestApplication,
  UnauthorizedException,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { GymAdminController } from '../src/gym-admin/gym-admin.controller';
import { GymAdminService } from '../src/gym-admin/gym-admin.service';
import { RolesGuard } from '../src/auth/roles.guard';
import { JwtAuthGuard } from '../src/auth/jwt.guard';
import { GymAdminRole } from '@prisma/client';
import { Reflector } from '@nestjs/core';

type JwtReqUser = { id: number; gymId: number; role: GymAdminRole };

// ---- Mock Guards ----
class MockJwtGuardUnauthorized implements CanActivate {
  canActivate(): boolean {
    throw new UnauthorizedException('Unauthorized');
  }
}

class MockJwtGuardWithUser implements CanActivate {
  constructor(private readonly user: JwtReqUser) {}
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{ user?: JwtReqUser }>();
    req.user = this.user;
    return true;
  }
}

// ---- Mock Service ----
const mockGymAdminService = {
  getTodayReport: jest.fn().mockResolvedValue({
    totalVisitsToday: 5,
    uniqueUsersToday: 3,
  }),
};

describe('GymAdmin Reports Security (E2E)', () => {
  let app: INestApplication;

  // 401 — no auth
  describe('[GET] /gym-admin/reports/today → 401 when no auth', () => {
    beforeAll(async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        controllers: [GymAdminController],
        providers: [
          { provide: GymAdminService, useValue: mockGymAdminService },
          RolesGuard,
          Reflector,
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useClass(MockJwtGuardUnauthorized)
        .compile();

      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should return 401', async () => {
      await request(app.getHttpServer() as unknown as import('http').Server)
        .get('/gym-admin/reports/today')
        .expect(401);
    });
  });

  // 403 — receptionist
  describe('[GET] /gym-admin/reports/today → 403 for RECEPTIONIST', () => {
    beforeAll(async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        controllers: [GymAdminController],
        providers: [
          { provide: GymAdminService, useValue: mockGymAdminService },
          RolesGuard,
          Reflector,
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue(
          new MockJwtGuardWithUser({
            id: 1,
            gymId: 10,
            role: GymAdminRole.RECEPTIONIST,
          }),
        )
        .compile();

      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should return 403', async () => {
      await request(app.getHttpServer() as unknown as import('http').Server)
        .get('/gym-admin/reports/today')
        .expect(403);
    });
  });

  // 200 — supervisor
  describe('[GET] /gym-admin/reports/today → 200 for GYM_SUPERVISOR', () => {
    beforeAll(async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        controllers: [GymAdminController],
        providers: [
          { provide: GymAdminService, useValue: mockGymAdminService },
          RolesGuard,
          Reflector,
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue(
          new MockJwtGuardWithUser({
            id: 2,
            gymId: 10,
            role: GymAdminRole.GYM_SUPERVISOR,
          }),
        )
        .compile();

      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should return 200 and numeric fields', async () => {
      await request(app.getHttpServer() as unknown as import('http').Server)
        .get('/gym-admin/reports/today')
        .expect(200)
        .expect((res: import('supertest').Response) => {
          const body: Record<string, unknown> = res.body;
          expect(typeof body.totalVisitsToday).toBe('number');
          expect(typeof body.uniqueUsersToday).toBe('number');
        });
    });
  });
});
