import request from 'supertest';
import app from '../src/app.js';

describe('GET /health', () => {
  it('returns 200 and a healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
