import request from 'supertest';
import express from 'express';
import configRouter from '../../routes/config';
import * as ai from '../../services/ai';

jest.mock('../../services/ai');
const mockGetModeInfo = ai.getModeInfo as jest.MockedFunction<typeof ai.getModeInfo>;
const mockSetMode = ai.setMode as jest.MockedFunction<typeof ai.setMode>;
const mockHasClaudeKey = ai.hasClaudeKey as jest.MockedFunction<typeof ai.hasClaudeKey>;
const mockHasLocalAIUrl = ai.hasLocalAIUrl as jest.MockedFunction<typeof ai.hasLocalAIUrl>;

const app = express();
app.use(express.json());
app.use('/api', configRouter);

const localInfo = {
  mode: 'local' as const,
  model: 'Local — Qwen2.5 7B (Ollama)',
  requiresKey: false,
  claudeKeyAvailable: false,
  localAvailable: true,
};

const claudeInfo = {
  mode: 'claude' as const,
  model: 'Claude Sonnet (Anthropic)',
  requiresKey: true,
  claudeKeyAvailable: true,
  localAvailable: false,
};

beforeEach(() => {
  mockGetModeInfo.mockReturnValue(localInfo);
  mockHasClaudeKey.mockReturnValue(false);
  mockHasLocalAIUrl.mockReturnValue(false);
  mockSetMode.mockImplementation(() => {});
});

describe('GET /api/mode', () => {
  it('returns mode/model/requiresKey/claudeKeyAvailable fields', async () => {
    const res = await request(app).get('/api/mode');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('mode');
    expect(res.body).toHaveProperty('model');
    expect(res.body).toHaveProperty('requiresKey');
    expect(res.body).toHaveProperty('claudeKeyAvailable');
    expect(res.body).toHaveProperty('localAvailable');
  });
});

describe('POST /api/mode', () => {
  it('returns 400 when mode is an invalid string', async () => {
    const res = await request(app).post('/api/mode').send({ mode: 'invalid' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid mode/i);
  });

  it('returns 400 when mode is "claude" but no claude key', async () => {
    mockHasClaudeKey.mockReturnValue(false);
    const res = await request(app).post('/api/mode').send({ mode: 'claude' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ANTHROPIC_API_KEY/);
  });

  it('returns 400 when mode is "local" but no base URL', async () => {
    mockHasLocalAIUrl.mockReturnValue(false);
    const res = await request(app).post('/api/mode').send({ mode: 'local' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/LOCAL_AI_BASE_URL/);
  });

  it('calls setMode and returns 200 for "local" when base URL exists', async () => {
    mockHasLocalAIUrl.mockReturnValue(true);
    const res = await request(app).post('/api/mode').send({ mode: 'local' });
    expect(res.status).toBe(200);
    expect(mockSetMode).toHaveBeenCalledWith('local');
    expect(res.body.mode).toBe('local');
  });

  it('calls setMode and returns 200 for "claude" when key exists', async () => {
    mockHasClaudeKey.mockReturnValue(true);
    mockGetModeInfo.mockReturnValue(claudeInfo);
    const res = await request(app).post('/api/mode').send({ mode: 'claude' });
    expect(res.status).toBe(200);
    expect(mockSetMode).toHaveBeenCalledWith('claude');
    expect(res.body.mode).toBe('claude');
  });
});
