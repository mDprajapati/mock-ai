import { Phase, PHASE_NAMES } from '../types';

interface PhaseAdvanceModalProps {
  currentPhase: Phase;
  nextPhase: Phase;
  countdown: number;
  onContinue: () => void;
  onStay: () => void;
}

export function PhaseAdvanceModal({ currentPhase, nextPhase, countdown, onContinue, onStay }: PhaseAdvanceModalProps) {
  return (
    <div className="absolute inset-0 bg-stage/85 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-surface border border-accent/25 rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl animate-scale-in">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto mb-5 animate-pop-in">
          <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-ink font-semibold text-lg mb-2">Phase {currentPhase} Complete!</h2>
        <p className="text-ink-secondary text-sm mb-1">Great work on this phase.</p>
        <p className="text-ink-muted text-sm mb-6">
          Moving to{' '}
          <span className="text-accent-bright font-medium">
            Phase {nextPhase}: {PHASE_NAMES[nextPhase]}
          </span>
          {' '}in{' '}
          <span className="text-emerald-400 font-bold">{countdown}s</span>
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onContinue}
            className="px-5 py-2.5 bg-accent hover:bg-accent-bright active:bg-accent-deep text-accent-ink text-sm font-semibold rounded-xl transition-colors"
          >
            Continue Now
          </button>
          <button
            onClick={onStay}
            className="px-5 py-2.5 border border-white/[0.08] text-ink-secondary hover:border-white/20 hover:text-ink text-sm font-medium rounded-xl transition-colors"
          >
            Stay in Phase {currentPhase}
          </button>
        </div>
      </div>
    </div>
  );
}
