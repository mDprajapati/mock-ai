import { chat as claudeChat, evaluate as claudeEvaluate } from './claude';
import { chat as localChat, evaluate as localEvaluate } from './localAI';
import type { MessageParam } from '../types';

export type AIMode = 'claude' | 'local';

// Runtime override — null means "auto-detect from env"
let runtimeMode: AIMode | null = null;

export function setMode(mode: AIMode): void {
  runtimeMode = mode;
}

export function getMode(): AIMode {
  if (runtimeMode !== null) return runtimeMode;
  if (process.env.ANTHROPIC_API_KEY?.trim()) return 'claude';
  return 'local';
}

export function hasClaudeKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY?.trim();
}

export function hasLocalAIUrl(): boolean {
  return !!process.env.LOCAL_AI_BASE_URL?.trim();
}

export function getModeInfo() {
  const mode = getMode();
  const modelNames: Record<AIMode, string> = {
    claude: 'Claude Sonnet (Anthropic)',
    local:  'Local — Qwen2.5 7B (Ollama)',
  };
  return {
    mode,
    model: modelNames[mode],
    requiresKey: mode === 'claude',
    claudeKeyAvailable: hasClaudeKey(),
    localAvailable: hasLocalAIUrl(),
  };
}

export async function chatAI(systemPrompt: string, messages: MessageParam[]): Promise<string> {
  const mode = getMode();
  if (mode === 'claude') return claudeChat(systemPrompt, messages);
  return localChat(systemPrompt, messages);
}

export async function evaluateAI(systemPrompt: string, userMessage: string): Promise<string> {
  const mode = getMode();
  if (mode === 'claude') return claudeEvaluate(systemPrompt, userMessage);
  return localEvaluate(systemPrompt, userMessage);
}
