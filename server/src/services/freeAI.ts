import axios from 'axios';
import type { MessageParam } from '../types';

const BASE = 'https://text.pollinations.ai/';
const MODELS = ['openai', 'mistral', 'llama', 'qwen', 'deepseek', 'phi'];
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function tryModel(model: string, system: string, messages: MessageParam[]): Promise<string> {
  const body = {
    model,
    system,
    messages,
    seed: Math.floor(Math.random() * 99999),
    private: true,
  };

  const response = await axios.post<string>(BASE, body, {
    headers: { 'Content-Type': 'application/json', 'Accept': '*/*' },
    timeout: 60_000,
    transformResponse: [(data: unknown) => data],
  });

  const raw = response.data as string;
  if (!raw || !raw.trim()) throw new Error('Empty response from Pollinations API');

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.choices?.[0]?.message?.content) {
      return parsed.choices[0].message.content.trim();
    }
    if (parsed?.error) {
      throw new Error(`Pollinations error: ${JSON.stringify(parsed.error)}`);
    }
  } catch (jsonErr: any) {
    if (jsonErr.message.startsWith('Pollinations error')) throw jsonErr;
  }

  return raw.trim();
}

function isRetryable(err: any): boolean {
  const status = err?.response?.status ?? err?.status;
  return status === 429 || (status >= 500 && status < 600);
}

export async function chatFree(systemPrompt: string, messages: MessageParam[]): Promise<string> {
  let lastError: any;

  // 3 rounds with backoff: immediate, 12 s, 25 s
  const ROUND_DELAYS_MS = [0, 12000, 25000];

  for (let round = 0; round < ROUND_DELAYS_MS.length; round++) {
    if (round > 0) {
      console.log(`[freeAI] round ${round + 1}: waiting ${ROUND_DELAYS_MS[round]}ms before retrying all models…`);
      await sleep(ROUND_DELAYS_MS[round]);
    }

    for (let i = 0; i < MODELS.length; i++) {
      const model = MODELS[i];
      try {
        if (i > 0) await sleep(3000); // let previous in-flight request clear the IP queue
        const result = await tryModel(model, systemPrompt, messages);
        if (round > 0 || i > 0) {
          console.log(`[freeAI] success with model "${model}" (round ${round + 1})`);
        }
        return result;
      } catch (err: any) {
        lastError = err;
        const status = err?.response?.status ?? err?.status;
        console.log(`[freeAI] model "${model}" returned ${status ?? 'error: ' + err.message}`);
        if (!isRetryable(err)) throw err; // bail immediately on non-rate-limit errors
      }
    }
  }

  throw lastError ?? new Error('All free AI models are rate-limited. Please wait a moment and retry.');
}
