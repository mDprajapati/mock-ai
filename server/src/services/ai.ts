import { chat as claudeChat, evaluate as claudeEvaluate } from './claude';
import { chat as groqChat, evaluate as groqEvaluate } from './groq';
import { chatFree } from './freeAI';
import type { MessageParam } from '../types';

export type AIMode = 'claude' | 'groq' | 'free';

// Runtime override — null means "auto-detect from env"
let runtimeMode: AIMode | null = null;

export function setMode(mode: AIMode): void {
  runtimeMode = mode;
}

export function getMode(): AIMode {
  if (runtimeMode !== null) return runtimeMode;
  if (process.env.ANTHROPIC_API_KEY?.trim()) return 'claude';
  if (process.env.GROQ_API_KEY?.trim()) return 'groq';
  return 'free';
}

export function hasClaudeKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY?.trim();
}

export function hasGroqKey(): boolean {
  return !!process.env.GROQ_API_KEY?.trim();
}

export function getModeInfo() {
  const mode = getMode();
  const modelNames: Record<AIMode, string> = {
    claude: 'Claude Sonnet (Anthropic)',
    groq:   'Llama 3.3-70B (Groq — Free)',
    free:   'GPT-4o-mini via Pollinations (Free)',
  };
  return {
    mode,
    model: modelNames[mode],
    requiresKey: mode === 'claude',
    claudeKeyAvailable: hasClaudeKey(),
    groqKeyAvailable: hasGroqKey(),
  };
}

export async function chatAI(systemPrompt: string, messages: MessageParam[]): Promise<string> {
  const mode = getMode();
  if (mode === 'claude') return claudeChat(systemPrompt, messages);
  if (mode === 'groq')   return groqChat(systemPrompt, messages);
  return chatFree(systemPrompt, messages);
}

export async function evaluateAI(systemPrompt: string, userMessage: string): Promise<string> {
  const mode = getMode();
  if (mode === 'claude') return claudeEvaluate(systemPrompt, userMessage);
  if (mode === 'groq')   return groqEvaluate(systemPrompt, userMessage);
  const combinedSystem = (
    systemPrompt +
    '\n\nIMPORTANT: Your entire response must be valid JSON only. No markdown, no code fences, no extra text — just the raw JSON object.'
  ).slice(0, 5000);
  return chatFree(combinedSystem, [{ role: 'user', content: userMessage }]);
}
