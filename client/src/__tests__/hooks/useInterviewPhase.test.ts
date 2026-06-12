import { renderHook, act } from '@testing-library/react';
import { useInterviewPhase } from '../../hooks/useInterviewPhase';
import { PHASE_DURATIONS } from '../../types';

describe('useInterviewPhase', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('initializes timeLeft to PHASE_DURATIONS[1]', () => {
    const { result } = renderHook(() =>
      useInterviewPhase('candidate_turn', 1, { onPhaseEnd: vi.fn() }),
    );
    expect(result.current.timeLeft).toBe(PHASE_DURATIONS[1]);
  });

  it('initializes showAdvanceModal to false', () => {
    const { result } = renderHook(() =>
      useInterviewPhase('candidate_turn', 1, { onPhaseEnd: vi.fn() }),
    );
    expect(result.current.showAdvanceModal).toBe(false);
  });

  it('timer counts down 1 second per tick', () => {
    const { result } = renderHook(() =>
      useInterviewPhase('candidate_turn', 1, { onPhaseEnd: vi.fn() }),
    );
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.timeLeft).toBe(PHASE_DURATIONS[1] - 1);
  });

  it('calls onPhaseEnd when timeLeft reaches 0', () => {
    const onPhaseEnd = vi.fn();
    renderHook(() => useInterviewPhase('candidate_turn', 1, { onPhaseEnd }));
    act(() => { vi.advanceTimersByTime(PHASE_DURATIONS[1] * 1000); });
    expect(onPhaseEnd).toHaveBeenCalledWith(1);
  });

  it('timer pauses when status is "loading"', () => {
    const { result } = renderHook(() =>
      useInterviewPhase('loading', 1, { onPhaseEnd: vi.fn() }),
    );
    const before = result.current.timeLeft;
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.timeLeft).toBe(before);
  });

  it('timer pauses when status is "evaluating"', () => {
    const { result } = renderHook(() =>
      useInterviewPhase('evaluating', 1, { onPhaseEnd: vi.fn() }),
    );
    const before = result.current.timeLeft;
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.timeLeft).toBe(before);
  });

  it('timer pauses when status is "phase_transition"', () => {
    const { result } = renderHook(() =>
      useInterviewPhase('phase_transition', 1, { onPhaseEnd: vi.fn() }),
    );
    const before = result.current.timeLeft;
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.timeLeft).toBe(before);
  });

  it('startAdvanceCountdown opens modal and counts down', () => {
    const { result } = renderHook(() =>
      useInterviewPhase('candidate_turn', 1, { onPhaseEnd: vi.fn() }),
    );
    act(() => { result.current.startAdvanceCountdown(2); });
    expect(result.current.showAdvanceModal).toBe(true);
    expect(result.current.advanceCountdown).toBe(8);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.advanceCountdown).toBe(7);
  });

  it('setTimeLeft can reset timer', () => {
    const { result } = renderHook(() =>
      useInterviewPhase('candidate_turn', 1, { onPhaseEnd: vi.fn() }),
    );
    act(() => { result.current.setTimeLeft(100); });
    expect(result.current.timeLeft).toBe(100);
  });

  it('setShowAdvanceModal can close modal', () => {
    const { result } = renderHook(() =>
      useInterviewPhase('candidate_turn', 1, { onPhaseEnd: vi.fn() }),
    );
    act(() => { result.current.startAdvanceCountdown(2); });
    expect(result.current.showAdvanceModal).toBe(true);
    act(() => { result.current.setShowAdvanceModal(false); });
    expect(result.current.showAdvanceModal).toBe(false);
  });

  it('resetTimer resets timeLeft to PHASE_DURATIONS for given phase', () => {
    const { result } = renderHook(() =>
      useInterviewPhase('candidate_turn', 1, { onPhaseEnd: vi.fn() }),
    );
    act(() => { result.current.setTimeLeft(100); });
    act(() => { result.current.resetTimer(2); });
    expect(result.current.timeLeft).toBe(PHASE_DURATIONS[2]);
  });

  it('cleans up interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = renderHook(() =>
      useInterviewPhase('candidate_turn', 1, { onPhaseEnd: vi.fn() }),
    );
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
