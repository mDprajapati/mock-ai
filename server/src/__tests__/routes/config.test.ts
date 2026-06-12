import request from 'supertest';
import express from 'express';
import configRouter from '../../routes/config';
import * as ai from '../../services/ai';

jest.mock('../../services/ai');
const mockGetModeInfo = ai.getModeInfo as jest.MockedFunction<typeof ai.getModeInfo>;
const mockSetMode = ai.setMode as jest.MockedFunction<typeof ai.setMode>;
const mockHasClaudeKey = ai.hasClaudeKey as jest.MockedFunction<typeof ai.hasClaudeKey>;
const mockHasGroqKey = ai.hasGroqKey as jest.MockedFunction<typeof ai.hasGroqKey>;

const app = express();
app.use(express.json());
app.use('/api', configRouter);

const freeInfo = {
  mode: 'free' as const,
  model: 'GPT-4o-mini via Pollinations (Free)',
  requiresKey: false,
  claudeKeyAvailable: false,
  groqKeyAvailable: false,
};

const claudeInfo = {
  mode: 'claude' as const,
  model: 'Claude Sonnet (Anthropic)',
  requiresKey: true,
  claudeKeyAvailable: true,
  groqKeyAvailable: false,
};

beforeEach(() => {
  mockGetModeInfo.mockReturnValue(freeInfo);
  mockHasClaudeKey.mockReturnValue(false);
  mockHasGroqKey.mockReturnValue(false);
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
  });

  it('returns "free" mode when no env keys are set', async () => {
    const res = await request(app).get('/api/mode');
    expect(res.body.mode).toBe('free');
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

  it('returns 400 when mode is "groq" but no groq key', async () => {
    mockHasGroqKey.mockReturnValue(false);
    const res = await request(app).post('/api/mode').send({ mode: 'groq' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/GROQ_API_KEY/);
  });

  it('calls setMode and returns 200 for valid "free" mode', async () => {
    const res = await request(app).post('/api/mode').send({ mode: 'free' });
    expect(res.status).toBe(200);
    expect(mockSetMode).toHaveBeenCalledWith('free');
  });

  it('calls setMode and returns 200 for "claude" when key exists', async () => {
    mockHasClaudeKey.mockReturnValue(true);
    mockGetModeInfo.mockReturnValue(claudeInfo);
    const res = await request(app).post('/api/mode').send({ mode: 'claude' });
    expect(res.status).toBe(200);
    expect(mockSetMode).toHaveBeenCalledWith('claude');
    expect(res.body.mode).toBe('claude');
  });

  it('calls setMode and returns 200 for "groq" when key exists', async () => {
    mockHasGroqKey.mockReturnValue(true);
    mockGetModeInfo.mockReturnValue({ ...freeInfo, mode: 'groq', model: 'Llama' });
    const res = await request(app).post('/api/mode').send({ mode: 'groq' });
    expect(res.status).toBe(200);
    expect(mockSetMode).toHaveBeenCalledWith('groq');
  });
});
