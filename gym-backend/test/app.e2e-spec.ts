import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) should respond 200', async () => {
    const res = await request(
      app.getHttpServer() as unknown as import('http').Server,
    )
      .get('/')
      .expect(200);

    expect(typeof res.text === 'string' || typeof res.body === 'object').toBe(
      true,
    );
  });
});
