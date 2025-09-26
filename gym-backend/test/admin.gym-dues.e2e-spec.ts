/* eslint-disable prettier/prettier */
import request from 'supertest';

const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

/** ================== Types ================== */
type LoginRes = { access_token: string };

type GymDuesItem = {
  gymId: number;
  gymName: string;
  visits: number;
  visitPrice: number | null;
  dues: number;
};

type GymDuesRes = {
  range: { from: string; to: string; timezone?: string };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  sort: { by: 'dues' | 'visits'; order: 'asc' | 'desc' };
  items: GymDuesItem[];
  totals?: { totalVisits: number; totalDues: number };
};

/** ================== Type guards ================== */
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const isString = (v: unknown): v is string => typeof v === 'string';
const isNumber = (v: unknown): v is number => typeof v === 'number';

const hasKey = <K extends string>(o: unknown, k: K): o is Record<K, unknown> =>
  isRecord(o) && k in o;

function isLoginRes(x: unknown): x is LoginRes {
  return hasKey(x, 'access_token') && isString(x.access_token);
}

function isGymDuesRes(x: unknown): x is GymDuesRes {
  if (!isRecord(x)) return false;

  if (!hasKey(x, 'items') || !Array.isArray(x.items)) return false;

  if (!hasKey(x, 'pagination') || !isRecord(x.pagination)) return false;
  if (!hasKey(x.pagination, 'page') || !isNumber(x.pagination.page)) return false;
  if (!hasKey(x.pagination, 'pageSize') || !isNumber(x.pagination.pageSize)) return false;
  if (!hasKey(x.pagination, 'total') || !isNumber(x.pagination.total)) return false;
  if (!hasKey(x.pagination, 'totalPages') || !isNumber(x.pagination.totalPages)) return false;

  if (!hasKey(x, 'sort') || !isRecord(x.sort)) return false;
  if (!hasKey(x.sort, 'by') || !hasKey(x.sort, 'order')) return false;

  const by = x.sort.by;
  const order = x.sort.order;
  const byOk = by === 'dues' || by === 'visits';
  const orderOk = order === 'asc' || order === 'desc';

  return byOk && orderOk;
}

/** --------- Small helper to show useful HTTP errors ---------- */
async function sendOk(req: request.Test, allowed: number[] = [200]): Promise<request.Response> {
  const res = await req;
  if (!allowed.includes(res.status)) {
    const bodyStr = isRecord(res.body) ? JSON.stringify(res.body) : (res.text ?? '');
    throw new Error(`HTTP ${res.status} from ${res.request?.method ?? ''} ${res.request?.url ?? ''}\nBody: ${bodyStr}`);
  }
  return res;
}

/** ================== Tests ================== */
describe('Admin Gym Dues (e2e)', () => {
  const api = request(baseUrl);
  let token = '';

  it('logs in as admin (owner) and saves JWT', async () => {
    const email = process.env.E2E_ADMIN_EMAIL ?? 'owner@fitzy.local';
    const password = process.env.E2E_ADMIN_PASSWORD ?? 'owner123';

    const res = await sendOk(api.post('/auth/admin/login').send({ email, password }), [200, 201]);
    const body: unknown = res.body;
    if (!isLoginRes(body)) throw new Error(`Invalid login response shape: ${JSON.stringify(body)}`);
    token = body.access_token;
    expect(isString(token)).toBe(true);
  });

  it('GET /reports/admin/gym-dues returns items', async () => {
    const res = await sendOk(
      api
        .get('/reports/admin/gym-dues')
        .set('Authorization', `Bearer ${token}`)
        .query({
          period: '30d',
          sortBy: 'dues',
          order: 'desc',
          page: 1,
          pageSize: 10,
        }),
      [200],
    );

    const dataUnknown: unknown = res.body;
    if (!isGymDuesRes(dataUnknown)) throw new Error(`Invalid dues response shape: ${JSON.stringify(dataUnknown)}`);
    const data = dataUnknown; // TS narrows to GymDuesRes

    // basic expectations
    expect(Array.isArray(data.items)).toBe(true);
    expect(isNumber(data.pagination.page)).toBe(true);
    expect(['dues', 'visits']).toContain(data.sort.by);
    expect(['asc', 'desc']).toContain(data.sort.order);

    const items = data.items;
    if (items.length > 0) {
      const i = items[0];
      expect(isNumber(i.gymId)).toBe(true);
      expect(isString(i.gymName)).toBe(true);
      expect(isNumber(i.visits)).toBe(true);
      expect(i.visitPrice === null || isNumber(i.visitPrice)).toBe(true);
      expect(isNumber(i.dues)).toBe(true);

      const { by, order } = data.sort;
      if (items.length >= 2 && by === 'dues' && order === 'desc') {
        const duesArr = items.map((x) => x.dues);
        const sorted = [...duesArr].sort((a, b) => b - a);
        expect(duesArr).toEqual(sorted);
      }
    }

    const totals = data.totals;
    if (totals) {
      expect(isNumber(totals.totalVisits)).toBe(true);
      expect(isNumber(totals.totalDues)).toBe(true);
    }
  });
});
