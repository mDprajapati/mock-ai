export interface SessionData {
  cvText: string;
  jdText: string;
  experience: string;
  jdSkipped?: boolean;
}

export interface TranscriptEntry {
  role: 'ai' | 'candidate';
  text: string;
  phase: number;
}

export type MessageParam = { role: 'user' | 'assistant'; content: string };

export interface EvaluationPhase {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface EvaluationReport {
  phase1: EvaluationPhase;
  phase2: EvaluationPhase;
  phase3: EvaluationPhase;
  overall: number;
  summary: string;
}
