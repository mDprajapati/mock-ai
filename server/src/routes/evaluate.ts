import { Router, Request, Response } from 'express';
import { evaluateAI } from '../services/ai';
import type { SessionData, TranscriptEntry, EvaluationReport } from '../types';

const router = Router();

interface EvaluateRequest {
  session: SessionData;
  transcript: TranscriptEntry[];
}

function extractFirstJsonObject(s: string): string | null {
  const start = s.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

router.post('/evaluate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { session, transcript } = req.body as EvaluateRequest;

    if (!session) {
      res.status(400).json({ error: 'Missing session data.' });
      return;
    }

    const phase1 = transcript.filter((e) => e.phase === 1);
    const phase2 = transcript.filter((e) => e.phase === 2);
    const phase3 = transcript.filter((e) => e.phase === 3);

    const formatPhase = (entries: TranscriptEntry[]) =>
      entries.length === 0
        ? 'No responses recorded.'
        : entries
            .map((e) => `${e.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${e.text}`)
            .join('\n');

    const systemPrompt = `You are an expert technical interview evaluator. Evaluate the candidate's performance based on their interview transcript and return a JSON object only — no markdown, no explanation, just the JSON.`;

    const userMessage = `Evaluate this technical interview. Return ONLY valid JSON matching the schema below.

JOB DESCRIPTION:
${session.jdText.slice(0, 2000)}

CANDIDATE EXPERIENCE: ${session.experience} years

PHASE 1 — Introduction & Career:
${formatPhase(phase1)}

PHASE 2 — Theory & Technical:
${formatPhase(phase2)}

PHASE 3 — Practical / Coding:
${formatPhase(phase3)}

Return this exact JSON schema (no markdown, no backticks):
{
  "phase1": {
    "score": <number 1-10>,
    "feedback": "<2-4 sentence qualitative feedback>",
    "strengths": ["<strength>", "<strength>"],
    "improvements": ["<area>", "<area>"]
  },
  "phase2": {
    "score": <number 1-10>,
    "feedback": "<2-4 sentence qualitative feedback>",
    "strengths": ["<strength>", "<strength>"],
    "improvements": ["<area>", "<area>"]
  },
  "phase3": {
    "score": <number 1-10>,
    "feedback": "<2-4 sentence qualitative feedback>",
    "strengths": ["<strength>", "<strength>"],
    "improvements": ["<area>", "<area>"]
  },
  "overall": <number 1-10, average of the three>,
  "summary": "<3-5 sentence overall candidate summary>"
}`;

    const raw = await evaluateAI(systemPrompt, userMessage);

    // Strip markdown fences, then try multiple extraction strategies
    const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    let report: EvaluationReport;
    try {
      report = JSON.parse(stripped) as EvaluationReport;
    } catch {
      // Fall back to balanced-brace extraction to handle prose-wrapped JSON
      const jsonStr = extractFirstJsonObject(stripped);
      if (!jsonStr) throw new Error('AI returned non-JSON response — could not extract report.');
      report = JSON.parse(jsonStr) as EvaluationReport;
    }

    res.json({ report });
  } catch (err: any) {
    console.error('Evaluate error:', err.message);
    res.status(500).json({ error: 'Failed to evaluate interview.' });
  }
});

export default router;
