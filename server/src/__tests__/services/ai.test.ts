const mockClaudeChat = jest.fn();
const mockClaudeEvaluate = jest.fn();
const mockLocalChat = jest.fn();
const mockLocalEvaluate = jest.fn();

jest.mock('../../services/claude', () => ({
  chat: mockClaudeChat,
  evaluate: mockClaudeEvaluate,
}));

jest.mock('../../services/localAI', () => ({
  chat: mockLocalChat,
  evaluate: mockLocalEvaluate,
}));

describe('ai service', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.LOCAL_AI_BASE_URL;
    mockClaudeChat.mockReset();
    mockClaudeEvaluate.mockReset();
    mockLocalChat.mockReset();
    mockLocalEvaluate.mockReset();
  });

  afterAll(() => { process.env = OLD_ENV; });

  it('getMode auto-detects "claude" when ANTHROPIC_API_KEY is set', async () => {
    process.env.ANTHROPIC_API_KEY = 'key';
    const { getMode } = await import('../../services/ai');
    expect(getMode()).toBe('claude');
  });

  it('getMode returns "local" when no key is set', async () => {
    const { getMode } = await import('../../services/ai');
    expect(getMode()).toBe('local');
  });

  it('setMode overrides auto-detection', async () => {
    const { getMode, setMode } = await import('../../services/ai');
    setMode('claude');
    expect(getMode()).toBe('claude');
    setMode('local');
    expect(getMode()).toBe('local');
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

  it('hasLocalAIUrl returns true when base URL is set', async () => {
    process.env.LOCAL_AI_BASE_URL = 'http://localhost:11434';
    const { hasLocalAIUrl } = await import('../../services/ai');
    expect(hasLocalAIUrl()).toBe(true);
  });

  it('hasLocalAIUrl returns false when base URL is absent', async () => {
    const { hasLocalAIUrl } = await import('../../services/ai');
    expect(hasLocalAIUrl()).toBe(false);
  });

  it('getModeInfo returns requiresKey=true for claude mode', async () => {
    process.env.ANTHROPIC_API_KEY = 'key';
    const { getModeInfo } = await import('../../services/ai');
    const info = getModeInfo();
    expect(info.requiresKey).toBe(true);
    expect(info.mode).toBe('claude');
    expect(info.model).toContain('Claude');
  });

  it('getModeInfo returns requiresKey=false for local mode', async () => {
    const { getModeInfo } = await import('../../services/ai');
    const info = getModeInfo();
    expect(info.requiresKey).toBe(false);
    expect(info.mode).toBe('local');
  });

  it('chatAI delegates to claudeChat in claude mode', async () => {
    process.env.ANTHROPIC_API_KEY = 'key';
    mockClaudeChat.mockResolvedValue('claude response');
    const { chatAI } = await import('../../services/ai');
    const result = await chatAI('sys', []);
    expect(mockClaudeChat).toHaveBeenCalledWith('sys', []);
    expect(result).toBe('claude response');
  });

  it('chatAI delegates to localChat in local mode', async () => {
    mockLocalChat.mockResolvedValue('local response');
    const { chatAI } = await import('../../services/ai');
    const result = await chatAI('sys', []);
    expect(mockLocalChat).toHaveBeenCalledWith('sys', []);
    expect(result).toBe('local response');
  });

  it('evaluateAI delegates to claudeEvaluate in claude mode', async () => {
    process.env.ANTHROPIC_API_KEY = 'key';
    mockClaudeEvaluate.mockResolvedValue('claude eval');
    const { evaluateAI } = await import('../../services/ai');
    const result = await evaluateAI('sys', 'user');
    expect(mockClaudeEvaluate).toHaveBeenCalledWith('sys', 'user');
    expect(result).toBe('claude eval');
  });

  it('evaluateAI delegates to localEvaluate in local mode', async () => {
    mockLocalEvaluate.mockResolvedValue('local eval');
    const { evaluateAI } = await import('../../services/ai');
    const result = await evaluateAI('sys', 'user');
    expect(mockLocalEvaluate).toHaveBeenCalledWith('sys', 'user');
    expect(result).toBe('local eval');
  });
});
