import request from 'supertest';
import { app } from '../index';

// Mock all AI services so the test never hits real APIs
jest.mock('../services/ai', () => ({
  getModeInfo: jest.fn(() => ({
    mode: 'local',
    model: 'Local — Qwen2.5 7B (Ollama)',
    requiresKey: false,
    claudeKeyAvailable: false,
    localAvailable: true,
  })),
  setMode: jest.fn(),
  hasClaudeKey: jest.fn(() => false),
  hasLocalAIUrl: jest.fn(() => true),
  getMode: jest.fn(() => 'local'),
  chatAI: jest.fn().mockResolvedValue('test response'),
  evaluateAI: jest.fn().mockResolvedValue('{}'),
}));

jest.mock('../services/jsExercises', () => ({
  pickExercises: jest.fn(() => []),
}));

describe('Express app (integration)', () => {
  it('returns 404 for an unregistered route', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
  });

  it('mounts GET /api/mode', async () => {
    const res = await request(app).get('/api/mode');
    expect(res.status).toBe(200);
  });

  it('mounts POST /api/interview/message (returns 4xx on bad input)', async () => {
    const res = await request(app).post('/api/interview/message').send({});
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('mounts POST /api/evaluate (returns 4xx on bad input)', async () => {
    const res = await request(app).post('/api/evaluate').send({});
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('mounts POST /api/parse-cv (returns 400 with no file)', async () => {
    const res = await request(app).post('/api/parse-cv');
    expect(res.status).toBe(400);
  });

  it('mounts POST /api/fetch-jd (returns 4xx on bad input)', async () => {
    const res = await request(app).post('/api/fetch-jd').send({});
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('mounts GET /api/phase2/exercises', async () => {
    const res = await request(app).get('/api/phase2/exercises');
    expect(res.status).toBe(200);
  });

  it('includes Helmet X-Content-Type-Options header', async () => {
    const res = await request(app).get('/api/mode');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('responds with application/json content-type', async () => {
    const res = await request(app).get('/api/mode');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('POST /api/mode returns 400 for invalid mode string', async () => {
    const res = await request(app).post('/api/mode').send({ mode: 'invalid' });
    expect(res.status).toBe(400);
  });
});
