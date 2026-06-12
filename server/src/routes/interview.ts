import { Router, Request, Response } from 'express';
import { chatAI, getMode } from '../services/ai';
import type { JSExercise } from '../services/jsExercises';
import type { SessionData, TranscriptEntry } from '../types';

const router = Router();

interface MessageRequest {
  session: SessionData;
  transcript: TranscriptEntry[];
  phase: 1 | 2 | 3;
  jsExercises?: JSExercise[]; // provided by client for Phase 2
}

function buildPhase2Guide(exercises?: JSExercise[]): string {
  if (!exercises || exercises.length === 0) {
    return `
PHASE 2 — JavaScript Practical Coding Round:
- Give the candidate 3-4 practical JavaScript coding tasks appropriate for their experience level.
- Present ONE task at a time. When you present a new task, prefix your response with [TASK:N] where N is the task number (1, 2, 3...).
- Wait for the candidate to describe their approach/solution before moving to the next task.
- For follow-up questions on the SAME task, do NOT include [TASK:N].
- After all tasks, briefly probe trade-offs, time complexity, or edge cases.`;
  }

  const taskList = exercises
    .map((ex, i) => `  Task ${i + 1} — ${ex.title}:\n  ${ex.description.replace(/\n/g, '\n  ')}`)
    .join('\n\n');

  return `
PHASE 2 — JavaScript Practical Coding Round:
You have ${exercises.length} JavaScript exercises ready for the candidate (sourced from a real exercise repository). Present them ONE AT A TIME in order.

EXERCISES:
${taskList}

RULES:
- When presenting a new exercise, start your response with exactly "[TASK:N]" (e.g. "[TASK:1]") then introduce the task clearly.
- Do NOT include [TASK:N] for follow-up questions on the same exercise.
- After the candidate explains their solution/approach, move to the next task.
- After all exercises, ask one follow-up question about trade-offs or edge cases.
- The candidate has a live JavaScript editor — tell them to use it when presenting each task.`;
}

function buildSystemPrompt(
  phase: 1 | 2 | 3,
  session: SessionData,
  candidateAnswersInPhase: number,
  jsExercises?: JSExercise[],
): string {
  const isFree = getMode() === 'free';
  const cvLimit = isFree ? 2000 : 4000;
  const jdLimit = isFree ? 1500 : 3000;

  const jdSection = session.jdSkipped
    ? `[Not provided — infer the candidate's target role, tech stack, and relevant topics entirely from their CV above. Tailor all questions to their background.]`
    : session.jdText.slice(0, jdLimit);

  const base = `You are an experienced senior technical interviewer at a top-tier tech company.

CANDIDATE PROFILE:
Experience Level: ${session.experience} years
CV / Resume:
${session.cvText.slice(0, cvLimit)}

JOB DESCRIPTION:
${jdSection}

RULES:
- Ask exactly ONE question per response. Never ask multiple questions at once.
- Keep your question concise (2-3 sentences max).
- Do NOT add filler like "Great answer!" — just ask the question directly.
- Do NOT repeat questions already in the transcript.
- Be professional and focused.`;

  const phaseGuides: Record<1 | 2 | 3, string> = {
    1: `
PHASE 1 — Introduction & Career Review:
- Warm conversational opener; ease the candidate in.
- Ask about their career background, past projects, and experience from their CV.
- If this is the very first message, introduce yourself briefly then ask the first question.`,

    2: buildPhase2Guide(jsExercises),

    3: `
PHASE 3 — Practical / Coding Round:
- Present ONE practical coding task or system-design problem${session.jdSkipped ? ' relevant to the candidate\'s CV background' : ' from the JD'}.
- Ask the candidate to walk through their solution and explain their reasoning.
- Probe reasoning, trade-offs, and edge cases.
- Difficulty appropriate for ${session.experience} years experience.`,
  };

  // After enough exchanges, allow the AI to signal phase readiness
  const MIN_ANSWERS_TO_ADVANCE = 3;
  const advanceNote =
    candidateAnswersInPhase >= MIN_ANSWERS_TO_ADVANCE && phase < 3
      ? `

ADVANCE SIGNAL: The candidate has given ${candidateAnswersInPhase} answers in this phase. If you are genuinely satisfied with their overall performance and they have convincingly answered your questions, append exactly " [ADVANCE]" (one space before it) at the very end of your response — after your question. Only signal [ADVANCE] if the quality truly warrants it. Do NOT include [ADVANCE] if the candidate has been vague or unconvincing.`
      : '';

  const fullPrompt = base + phaseGuides[phase] + advanceNote;
  return isFree ? fullPrompt.slice(0, 5000) : fullPrompt;
}

function buildMessages(transcript: TranscriptEntry[]) {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  if (transcript.length === 0) {
    messages.push({ role: 'user', content: 'Please begin the interview.' });
    return messages;
  }

  for (let i = 0; i < transcript.length; i++) {
    const entry = transcript[i];
    if (entry.role === 'ai') {
      messages.push({ role: 'assistant', content: entry.text });
    } else {
      const isLast = i === transcript.length - 1;
      messages.push({
        role: 'user',
        content: isLast
          ? `Candidate: "${entry.text}"\n\nAsk the next question.`
          : `Candidate: "${entry.text}"`,
      });
    }
  }

  if (messages[messages.length - 1].role === 'assistant') {
    messages.push({ role: 'user', content: 'Please continue with the next question.' });
  }

  return messages;
}

router.post('/message', async (req: Request, res: Response): Promise<void> => {
  try {
    const { session, transcript, phase, jsExercises } = req.body as MessageRequest;

    if (!session?.cvText || (!session?.jdText && !session?.jdSkipped)) {
      res.status(400).json({ error: 'Missing session data.' });
      return;
    }

    const candidateAnswersInPhase = transcript.filter(
      (e) => e.role === 'candidate' && e.phase === phase,
    ).length;

    const systemPrompt = buildSystemPrompt(phase, session, candidateAnswersInPhase, jsExercises);
    const messages = buildMessages(transcript);

    console.log(`[Interview] phase=${phase} mode=${getMode()} messages=${messages.length} candidateAnswers=${candidateAnswersInPhase}`);

    const raw = await chatAI(systemPrompt, messages);

    // Parse optional advance signal
    let question = raw;
    let advancePhase = false;
    if (raw.includes('[ADVANCE]')) {
      advancePhase = true;
      question = raw.replace(/\s*\[ADVANCE\]/g, '').trim();
    }

    // Parse optional Phase 2 task index signal [TASK:N]
    let activeTaskIndex: number | undefined;
    const taskMatch = question.match(/\[TASK:(\d+)\]/);
    if (taskMatch) {
      activeTaskIndex = parseInt(taskMatch[1]) - 1; // 0-based
      question = question.replace(/\[TASK:\d+\]\s*/g, '').trim();
    }

    console.log(`[Interview] question generated (${question.length} chars) advancePhase=${advancePhase} activeTaskIndex=${activeTaskIndex ?? 'n/a'}`);
    res.json({ question, advancePhase, activeTaskIndex });
  } catch (err: any) {
    const httpStatus = err.response?.status;
    console.error('[Interview] ERROR:', err.message, httpStatus ? `HTTP ${httpStatus}` : '');
    res.status(500).json({
      error: 'Failed to generate interview question.',
      detail: err.message,
    });
  }
});

export default router;
