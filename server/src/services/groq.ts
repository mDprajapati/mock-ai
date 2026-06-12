import Groq from 'groq-sdk';

// Lazy singleton — instantiated on first use so dotenv has already loaded
let _groq: Groq | null = null;
function getClient(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

// llama-3.3-70b-versatile: best quality on free tier (1 000 req/day, 30 req/min)
// llama-3.1-8b-instant   : fallback — lighter model (14 400 req/day, 30 req/min)
const PRIMARY_MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';

import type { MessageParam } from '../types';

async function callGroq(model: string, systemPrompt: string, messages: MessageParam[], maxTokens: number): Promise<string> {
  const response = await getClient().chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  });
  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error('Empty response from Groq');
  return text.trim();
}

export async function chat(systemPrompt: string, messages: MessageParam[]): Promise<string> {
  try {
    return await callGroq(PRIMARY_MODEL, systemPrompt, messages, 600);
  } catch (err: any) {
    const status = err?.status ?? err?.response?.status;
    if (status === 429 || status === 503) {
      console.log(`[Groq] ${PRIMARY_MODEL} rate-limited, falling back to ${FALLBACK_MODEL}`);
      return await callGroq(FALLBACK_MODEL, systemPrompt, messages, 600);
    }
    throw err;
  }
}

export async function evaluate(systemPrompt: string, userMessage: string): Promise<string> {
  try {
    return await callGroq(PRIMARY_MODEL, systemPrompt, [{ role: 'user', content: userMessage }], 2000);
  } catch (err: any) {
    const status = err?.status ?? err?.response?.status;
    if (status === 429 || status === 503) {
      console.log(`[Groq] ${PRIMARY_MODEL} rate-limited, falling back to ${FALLBACK_MODEL}`);
      return await callGroq(FALLBACK_MODEL, systemPrompt, [{ role: 'user', content: userMessage }], 2000);
    }
    throw err;
  }
}
