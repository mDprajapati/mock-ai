const mockPost = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: { post: mockPost, get: jest.fn() },
}));

function mockSuccess(text: string) {
  mockPost.mockResolvedValueOnce({ data: text });
}

function mockJsonSuccess(content: string) {
  mockPost.mockResolvedValueOnce({
    data: JSON.stringify({ choices: [{ message: { content } }] }),
  });
}

function mockError(status: number) {
  const err: any = new Error(`HTTP ${status}`);
  err.response = { status };
  mockPost.mockRejectedValueOnce(err);
}

// Helper: start chatFree and advance timers past inter-model sleeps as needed
async function runWithTimers(fn: () => Promise<string>, advanceMs = 0) {
  const p = fn();
  if (advanceMs > 0) {
    await jest.advanceTimersByTimeAsync(advanceMs);
  }
  return p;
}

describe('freeAI service', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());

  beforeEach(() => {
    jest.resetModules();
    mockPost.mockReset();
    jest.clearAllTimers();
  });

  it('returns plain text response from first model (no timer needed)', async () => {
    mockSuccess('Hello from AI');
    const { chatFree } = await import('../../services/freeAI');
    const result = await chatFree('sys', []);
    expect(result).toBe('Hello from AI');
  });

  it('parses OpenAI-style JSON response', async () => {
    mockJsonSuccess('Parsed content');
    const { chatFree } = await import('../../services/freeAI');
    const result = await chatFree('sys', []);
    expect(result).toBe('Parsed content');
  });

  it('throws immediately on non-retryable 400 error', async () => {
    mockError(400);
    const { chatFree } = await import('../../services/freeAI');
    await expect(chatFree('sys', [])).rejects.toThrow('HTTP 400');
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it('falls back to second model on 429 (advance 3s inter-model sleep)', async () => {
    mockError(429);
    mockSuccess('fallback response');
    const { chatFree } = await import('../../services/freeAI');
    const p = chatFree('sys', []);
    await jest.advanceTimersByTimeAsync(3100);
    const result = await p;
    expect(result).toBe('fallback response');
    expect(mockPost).toHaveBeenCalledTimes(2);
  });

  it('falls back on 503 (5xx retryable)', async () => {
    mockError(503);
    mockSuccess('ok');
    const { chatFree } = await import('../../services/freeAI');
    const p = chatFree('sys', []);
    await jest.advanceTimersByTimeAsync(3100);
    const result = await p;
    expect(result).toBe('ok');
  });

  it('throws "Pollinations error" when JSON response has error field', async () => {
    mockPost.mockResolvedValueOnce({ data: JSON.stringify({ error: 'model not found' }) });
    const { chatFree } = await import('../../services/freeAI');
    await expect(chatFree('sys', [])).rejects.toThrow('Pollinations error');
  });

  it('throws on empty response', async () => {
    mockPost.mockResolvedValueOnce({ data: '' });
    const { chatFree } = await import('../../services/freeAI');
    await expect(chatFree('sys', [])).rejects.toThrow('Empty response');
  });

  it('does not internally truncate systemPrompt (caller responsibility)', async () => {
    const longPrompt = 'x'.repeat(10000);
    mockSuccess('ok');
    const { chatFree } = await import('../../services/freeAI');
    await chatFree(longPrompt, []);
    const calledBody = mockPost.mock.calls[0][1];
    expect(calledBody.system).toBe(longPrompt);
  });

  it('falls back through 3 models on consecutive 429s', async () => {
    mockError(429); // model 1
    mockError(429); // model 2
    mockSuccess('third model');
    const { chatFree } = await import('../../services/freeAI');
    const p = chatFree('sys', []);
    // Advance past sleep(3000) × 2 between models
    await jest.advanceTimersByTimeAsync(3100);
    await jest.advanceTimersByTimeAsync(3100);
    const result = await p;
    expect(result).toBe('third model');
    expect(mockPost).toHaveBeenCalledTimes(3);
  });

  it('exhausts all 6 models in round 1 and enters round 2 after 12s sleep', async () => {
    for (let i = 0; i < 6; i++) mockError(429);
    mockSuccess('round 2 success');
    const { chatFree } = await import('../../services/freeAI');
    const p = chatFree('sys', []);
    // advance past 5 inter-model sleeps (models 2-6): 5 × 3000 = 15000ms
    await jest.advanceTimersByTimeAsync(15100);
    // advance past the round-2 delay of 12000ms
    await jest.advanceTimersByTimeAsync(12100);
    const result = await p;
    expect(result).toBe('round 2 success');
    expect(mockPost).toHaveBeenCalledTimes(7);
  });

  it('throws lastError after all 3 rounds and 18 model attempts are exhausted (line 76)', async () => {
    // 6 models × 3 rounds = 18 failures → hits the throw after all loops
    for (let i = 0; i < 18; i++) mockError(429);
    const { chatFree } = await import('../../services/freeAI');
    const p = chatFree('sys', []);
    // Attach rejection handler BEFORE advancing timers to avoid unhandled rejection warning
    const rejection = expect(p).rejects.toThrow('HTTP 429');
    // Round 1: 5 × 3000ms inter-model sleeps
    await jest.advanceTimersByTimeAsync(15100);
    // Round 2 pre-sleep: 12000ms, then 5 × 3000ms inter-model sleeps
    await jest.advanceTimersByTimeAsync(27100);
    // Round 3 pre-sleep: 25000ms, then 5 × 3000ms inter-model sleeps
    await jest.advanceTimersByTimeAsync(40100);
    await rejection;
    expect(mockPost).toHaveBeenCalledTimes(18);
  });
});
