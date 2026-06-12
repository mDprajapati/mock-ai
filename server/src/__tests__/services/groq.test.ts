export {};

const mockCreate = jest.fn();
const MockGroq = jest.fn(() => ({
  chat: { completions: { create: mockCreate } },
}));

jest.mock('groq-sdk', () => ({
  __esModule: true,
  default: MockGroq,
}));

describe('groq service', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, GROQ_API_KEY: 'test-groq-key' };
    mockCreate.mockReset();
    MockGroq.mockClear();
  });

  afterAll(() => { process.env = OLD_ENV; });

  function mockText(text: string) {
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: text } }] });
  }

  it('chat() returns text from primary model on success', async () => {
    mockText('  response  ');
    const { chat } = await import('../../services/groq');
    const result = await chat('sys', [{ role: 'user', content: 'hi' }]);
    expect(result).toBe('response');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('chat() falls back to second model on 429', async () => {
    const err: any = new Error('rate limit');
    err.status = 429;
    mockCreate.mockRejectedValueOnce(err);
    mockText('fallback');
    const { chat } = await import('../../services/groq');
    const result = await chat('sys', []);
    expect(result).toBe('fallback');
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(mockCreate.mock.calls[1][0].model).toBe('llama-3.1-8b-instant');
  });

  it('chat() falls back to second model on 503', async () => {
    const err: any = new Error('service unavailable');
    err.status = 503;
    mockCreate.mockRejectedValueOnce(err);
    mockText('fallback');
    const { chat } = await import('../../services/groq');
    const result = await chat('sys', []);
    expect(result).toBe('fallback');
  });

  it('chat() re-throws on non-rate-limit error (400)', async () => {
    const err: any = new Error('bad request');
    err.status = 400;
    mockCreate.mockRejectedValueOnce(err);
    const { chat } = await import('../../services/groq');
    await expect(chat('sys', [])).rejects.toThrow('bad request');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('chat() throws when response content is empty', async () => {
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: '' } }] });
    const { chat } = await import('../../services/groq');
    await expect(chat('sys', [])).rejects.toThrow('Empty response');
  });

  it('evaluate() returns text from primary model', async () => {
    mockText('eval result');
    const { evaluate } = await import('../../services/groq');
    const result = await evaluate('sys', 'user');
    expect(result).toBe('eval result');
  });

  it('evaluate() falls back on 429', async () => {
    const err: any = new Error('rate limit');
    err.status = 429;
    mockCreate.mockRejectedValueOnce(err);
    mockText('eval fallback');
    const { evaluate } = await import('../../services/groq');
    const result = await evaluate('sys', 'user');
    expect(result).toBe('eval fallback');
  });

  it('evaluate() re-throws on non-rate-limit error', async () => {
    const err: any = new Error('auth error');
    err.status = 401;
    mockCreate.mockRejectedValueOnce(err);
    const { evaluate } = await import('../../services/groq');
    await expect(evaluate('sys', 'user')).rejects.toThrow('auth error');
  });

  it('creates singleton Groq client on first use', async () => {
    mockText('a');
    mockText('b');
    const { chat } = await import('../../services/groq');
    await chat('sys', []);
    await chat('sys', []);
    expect(MockGroq).toHaveBeenCalledTimes(1);
  });

  it('chat() falls back using err.response.status path (not err.status)', async () => {
    // Error uses .response.status instead of .status
    const err: any = new Error('rate limit via response');
    err.response = { status: 429 };
    mockCreate.mockRejectedValueOnce(err);
    mockText('fallback via response.status');
    const { chat } = await import('../../services/groq');
    const result = await chat('sys', []);
    expect(result).toBe('fallback via response.status');
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('evaluate() falls back using err.response.status path', async () => {
    const err: any = new Error('rate limit via response');
    err.response = { status: 503 };
    mockCreate.mockRejectedValueOnce(err);
    mockText('eval fallback via response.status');
    const { evaluate } = await import('../../services/groq');
    const result = await evaluate('sys', 'user');
    expect(result).toBe('eval fallback via response.status');
  });
});
