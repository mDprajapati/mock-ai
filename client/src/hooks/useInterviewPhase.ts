import { useState, useRef, useCallback, useEffect } from 'react';
import { Phase, PHASE_DURATIONS } from '../types';

type PauseableStatus = 'loading' | 'phase_transition' | 'evaluating' | 'error';

interface UseInterviewPhaseOptions {
  initialPhase?: Phase;
  onPhaseEnd: (phase: Phase) => void;
}

interface UseInterviewPhaseReturn {
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  showAdvanceModal: boolean;
  setShowAdvanceModal: (v: boolean) => void;
  advanceCountdown: number;
  pendingNextPhaseRef: React.MutableRefObject<Phase | null>;
  advanceCountdownRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  startAdvanceCountdown: (nextPhase: Phase) => void;
  resetTimer: (phase: Phase) => void;
}

export function useInterviewPhase(
  status: string,
  phase: Phase,
  { onPhaseEnd }: UseInterviewPhaseOptions,
): UseInterviewPhaseReturn {
  const [timeLeft, setTimeLeft] = useState<number>(PHASE_DURATIONS[phase]);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceCountdown, setAdvanceCountdown] = useState(8);

  const advanceCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingNextPhaseRef = useRef<Phase | null>(null);

  const resetTimer = useCallback((p: Phase) => {
    setTimeLeft(PHASE_DURATIONS[p]);
  }, []);

  const startAdvanceCountdown = useCallback((nextPhase: Phase) => {
    pendingNextPhaseRef.current = nextPhase;
    setAdvanceCountdown(8);
    setShowAdvanceModal(true);

    if (advanceCountdownRef.current) clearInterval(advanceCountdownRef.current);
    advanceCountdownRef.current = setInterval(() => {
      setAdvanceCountdown((prev) => {
        if (prev <= 1) { clearInterval(advanceCountdownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Phase timer — pauses during loading/transition/evaluating/error
  const isPaused = (status as PauseableStatus) === 'loading' ||
    status === 'phase_transition' ||
    status === 'evaluating' ||
    status === 'error';

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(id); onPhaseEnd(phase); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, phase]);

  useEffect(() => () => {
    if (advanceCountdownRef.current) clearInterval(advanceCountdownRef.current);
  }, []);

  return {
    timeLeft,
    setTimeLeft,
    showAdvanceModal,
    setShowAdvanceModal,
    advanceCountdown,
    pendingNextPhaseRef,
    advanceCountdownRef,
    startAdvanceCountdown,
    resetTimer,
  };
}
