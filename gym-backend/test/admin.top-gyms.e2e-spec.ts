/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { AppModule } from '../src/app.module';

jest.setTimeout(30000);

/** أشكال الاستجابات */
type LoginResponse = {
  access_token?: string;
  accessToken?: string;
  token?: string;
  jwt?: string;
};

interface TopGymsItem {
  gymId: string | number;
  gymName: string;
  visits: number;
  revenue: number;
}
interface TopGymsResponse {
  range: { from: string; to: string; timezone?: string };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  sort: { by: string; order: string };
  items: TopGymsItem[];
}

describe('Admin Top Gyms (e2e)', () => {
  let app: INestApplication;
  let token = '';

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('logs in as admin (owner) and saves JWT', async () => {
    const res = await supertest(app.getHttpServer())
      .post('/auth/admin/login')
      .set('Content-Type', 'application/json')
      .send({ email: 'owner@fitzy.local', password: 'Admin123!' });

    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);

    const body = res.body as unknown as LoginResponse;
    token = body.access_token ?? body.accessToken ?? body.token ?? body.jwt ?? '';

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);
  });

  it('GET /admins/reports/top-gyms returns ranked items', async () => {
    const res = await supertest(app.getHttpServer())
      .get('/admins/reports/top-gyms?sortBy=visits&order=desc&page=1&pageSize=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const data = res.body as unknown as TopGymsResponse;

    expect(data).toHaveProperty('range');
    expect(data).toHaveProperty('pagination');
    expect(data).toHaveProperty('sort');
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.pageSize).toBeGreaterThanOrEqual(1);

    if (data.items.length > 0) {
      const item = data.items[0];
      expect(item).toHaveProperty('gymId');
      expect(item).toHaveProperty('gymName');
      expect(item).toHaveProperty('visits');
      expect(item).toHaveProperty('revenue');
    }
  });
});
