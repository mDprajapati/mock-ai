export type Experience = '0-2' | '2-5' | '5-8' | '8+';
export type Phase = 1 | 2 | 3;

export interface JSExercise {
  title: string;
  description: string;
  starterCode: string;
}

export interface SessionData {
  jdText: string;
  experience: Experience;
  cvText: string;
  cvFileName: string;
  jdSkipped?: boolean;
}

export interface TranscriptEntry {
  role: 'ai' | 'candidate';
  text: string;
  phase: Phase;
  timestamp: number;
}

export interface PhaseScore {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface EvaluationReport {
  phase1: PhaseScore;
  phase2: PhaseScore;
  phase3: PhaseScore;
  overall: number;
  summary: string;
}

export const PHASE_NAMES: Record<Phase, string> = {
  1: 'Introduction & Career',
  2: 'JS Coding Round',
  3: 'Practical / Coding',
};

// Durations in seconds — lower values for dev testing, raise for production:
// Production: 1 → 600 (10 min), 2 → 1500 (25 min), 3 → 1800 (30 min)
export const PHASE_DURATIONS: Record<Phase, number> = {
  1: 10 * 60,
  2: 25 * 60,
  3: 30 * 60,
};
