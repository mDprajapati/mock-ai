import axios from 'axios';
import type { MessageParam } from '../types';

// "Local" mode — talks to a local OpenAI-compatible model server (e.g. Ollama,
// vLLM, llama.cpp). Nothing is bundled into this app; you run the model server
// yourself and point LOCAL_AI_BASE_URL at it.
//
//   LOCAL_AI_BASE_URL  e.g. http://localhost:11434  (Ollama; required to enable)
//   LOCAL_AI_API_KEY   optional bearer token if your server requires auth
//   LOCAL_AI_MODEL     model name your server serves (default: "llama3.2:3b")

function getBaseUrl(): string {
  const base = process.env.LOCAL_AI_BASE_URL?.trim();
  if (!base) throw new Error('LOCAL_AI_BASE_URL is not configured in server/.env');
  return base.replace(/\/+$/, ''); // strip trailing slashes
}

function getModel(): string {
  return process.env.LOCAL_AI_MODEL?.trim() || 'qwen2.5:7b';
}

async function callLocalAI(
  systemPrompt: string,
  messages: MessageParam[],
  maxTokens: number,
): Promise<string> {
  const apiKey = process.env.LOCAL_AI_API_KEY?.trim();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const response = await axios.post(
    `${getBaseUrl()}/v1/chat/completions`,
    {
      model: getModel(),
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    },
    // Local CPU inference is slow (a few tokens/sec on machines without a GPU),
    // so a long generation can take minutes. Override via LOCAL_AI_TIMEOUT_MS.
    { headers, timeout: Number(process.env.LOCAL_AI_TIMEOUT_MS) || 600_000 },
  );

  const text = response.data?.choices?.[0]?.message?.content;
  if (!text || !String(text).trim()) throw new Error('Empty response from local model server');
  return String(text).trim();
}

export async function chat(systemPrompt: string, messages: MessageParam[]): Promise<string> {
  return callLocalAI(systemPrompt, messages, 600);
}

export async function evaluate(systemPrompt: string, userMessage: string): Promise<string> {
  return callLocalAI(systemPrompt, [{ role: 'user', content: userMessage }], 2000);
}
