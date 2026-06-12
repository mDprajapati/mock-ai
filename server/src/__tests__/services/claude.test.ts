export {};

const mockCreate = jest.fn();
const MockAnthropic = jest.fn(() => ({ messages: { create: mockCreate } }));

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: MockAnthropic,
}));

describe('claude service', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ANTHROPIC_API_KEY: 'test-key' };
    mockCreate.mockReset();
    MockAnthropic.mockClear();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  function mockTextResponse(text: string) {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text }],
    });
  }

  it('chat() calls messages.create with correct params and returns trimmed text', async () => {
    mockTextResponse('  Hello world  ');
    const { chat } = await import('../../services/claude');
    const result = await chat('system', [{ role: 'user', content: 'hi' }]);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: 'system',
      }),
    );
    expect(result).toBe('Hello world');
  });

  it('chat() throws when response block type is not text', async () => {
    mockCreate.mockResolvedValueOnce({ content: [{ type: 'image', source: {} }] });
    const { chat } = await import('../../services/claude');
    await expect(chat('sys', [])).rejects.toThrow('Unexpected response type');
  });

  it('evaluate() calls messages.create with max_tokens=2000', async () => {
    mockTextResponse('eval result');
    const { evaluate } = await import('../../services/claude');
    const result = await evaluate('system', 'user message');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ max_tokens: 2000 }),
    );
    expect(result).toBe('eval result');
  });

  it('evaluate() throws when response block type is not text', async () => {
    mockCreate.mockResolvedValueOnce({ content: [{ type: 'image', source: {} }] });
    const { evaluate } = await import('../../services/claude');
    await expect(evaluate('sys', 'msg')).rejects.toThrow('Unexpected response type');
  });

  it('throws when ANTHROPIC_API_KEY is missing', async () => {
    process.env = { ...OLD_ENV };
    delete process.env.ANTHROPIC_API_KEY;
    const { chat } = await import('../../services/claude');
    await expect(chat('sys', [])).rejects.toThrow('ANTHROPIC_API_KEY');
  });

  it('reuses the same Anthropic client instance on second call (lazy singleton)', async () => {
    mockTextResponse('a');
    mockTextResponse('b');
    const { chat } = await import('../../services/claude');
    await chat('sys', []);
    await chat('sys', []);
    expect(MockAnthropic).toHaveBeenCalledTimes(1);
  });
});
