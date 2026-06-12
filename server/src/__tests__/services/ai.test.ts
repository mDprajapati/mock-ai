const mockClaudeChat = jest.fn();
const mockClaudeEvaluate = jest.fn();
const mockGroqChat = jest.fn();
const mockGroqEvaluate = jest.fn();
const mockChatFree = jest.fn();

jest.mock('../../services/claude', () => ({
  chat: mockClaudeChat,
  evaluate: mockClaudeEvaluate,
}));

jest.mock('../../services/groq', () => ({
  chat: mockGroqChat,
  evaluate: mockGroqEvaluate,
}));

jest.mock('../../services/freeAI', () => ({
  chatFree: mockChatFree,
}));

describe('ai service', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GROQ_API_KEY;
    mockClaudeChat.mockReset();
    mockClaudeEvaluate.mockReset();
    mockGroqChat.mockReset();
    mockGroqEvaluate.mockReset();
    mockChatFree.mockReset();
  });

  afterAll(() => { process.env = OLD_ENV; });

  it('getMode auto-detects "claude" when ANTHROPIC_API_KEY is set', async () => {
    process.env.ANTHROPIC_API_KEY = 'key';
    const { getMode } = await import('../../services/ai');
    expect(getMode()).toBe('claude');
  });

  it('getMode auto-detects "groq" when only GROQ_API_KEY is set', async () => {
    process.env.GROQ_API_KEY = 'key';
    const { getMode } = await import('../../services/ai');
    expect(getMode()).toBe('groq');
  });

  it('getMode returns "free" when no keys are set', async () => {
    const { getMode } = await import('../../services/ai');
    expect(getMode()).toBe('free');
  });

  it('setMode overrides auto-detection', async () => {
    const { getMode, setMode } = await import('../../services/ai');
    setMode('claude');
    expect(getMode()).toBe('claude');
    setMode('free');
    expect(getMode()).toBe('free');
  });

  it('hasClaudeKey returns true when key is set', async () => {
    process.env.ANTHROPIC_API_KEY = 'key';
    const { hasClaudeKey } = await import('../../services/ai');
    expect(hasClaudeKey()).toBe(true);
  });

  it('hasClaudeKey returns false when key is absent', async () => {
    const { hasClaudeKey } = await import('../../services/ai');
    expect(hasClaudeKey()).toBe(false);
  });

  it('hasGroqKey returns true when key is set', async () => {
    process.env.GROQ_API_KEY = 'key';
    const { hasGroqKey } = await import('../../services/ai');
    expect(hasGroqKey()).toBe(true);
  });

  it('hasGroqKey returns false when key is absent', async () => {
    const { hasGroqKey } = await import('../../services/ai');
    expect(hasGroqKey()).toBe(false);
  });

  it('getModeInfo returns requiresKey=true for claude mode', async () => {
    process.env.ANTHROPIC_API_KEY = 'key';
    const { getModeInfo } = await import('../../services/ai');
    const info = getModeInfo();
    expect(info.requiresKey).toBe(true);
    expect(info.mode).toBe('claude');
    expect(info.model).toContain('Claude');
  });

  it('getModeInfo returns requiresKey=false for free mode', async () => {
    const { getModeInfo } = await import('../../services/ai');
    const info = getModeInfo();
    expect(info.requiresKey).toBe(false);
    expect(info.mode).toBe('free');
  });

  it('chatAI delegates to claudeChat in claude mode', async () => {
    process.env.ANTHROPIC_API_KEY = 'key';
    mockClaudeChat.mockResolvedValue('claude response');
    const { chatAI } = await import('../../services/ai');
    const result = await chatAI('sys', []);
    expect(mockClaudeChat).toHaveBeenCalledWith('sys', []);
    expect(result).toBe('claude response');
  });

  it('chatAI delegates to groqChat in groq mode', async () => {
    process.env.GROQ_API_KEY = 'key';
    mockGroqChat.mockResolvedValue('groq response');
    const { chatAI, setMode } = await import('../../services/ai');
    setMode('groq');
    const result = await chatAI('sys', []);
    expect(mockGroqChat).toHaveBeenCalled();
    expect(result).toBe('groq response');
  });

  it('chatAI delegates to chatFree in free mode', async () => {
    mockChatFree.mockResolvedValue('free response');
    const { chatAI } = await import('../../services/ai');
    const result = await chatAI('sys', []);
    expect(mockChatFree).toHaveBeenCalled();
    expect(result).toBe('free response');
  });

  it('evaluateAI delegates to claudeEvaluate in claude mode', async () => {
    process.env.ANTHROPIC_API_KEY = 'key';
    mockClaudeEvaluate.mockResolvedValue('claude eval');
    const { evaluateAI } = await import('../../services/ai');
    const result = await evaluateAI('sys', 'user');
    expect(mockClaudeEvaluate).toHaveBeenCalledWith('sys', 'user');
    expect(result).toBe('claude eval');
  });

  it('evaluateAI in free mode slices combinedSystem to 5000 chars', async () => {
    const longPrompt = 'x'.repeat(6000);
    mockChatFree.mockResolvedValue('free eval');
    const { evaluateAI } = await import('../../services/ai');
    await evaluateAI(longPrompt, 'user');
    const calledSystem: string = mockChatFree.mock.calls[0][0];
    expect(calledSystem.length).toBeLessThanOrEqual(5000);
  });

  it('evaluateAI delegates to groqEvaluate in groq mode', async () => {
    process.env.GROQ_API_KEY = 'key';
    mockGroqEvaluate.mockResolvedValue('groq eval');
    const { evaluateAI, setMode } = await import('../../services/ai');
    setMode('groq');
    const result = await evaluateAI('sys', 'user');
    expect(mockGroqEvaluate).toHaveBeenCalledWith('sys', 'user');
    expect(result).toBe('groq eval');
  });
});
