import { renderHook, act } from '@testing-library/react';
import { useTTS, useSTT } from '../../hooks/useSpeech';

describe('useTTS', () => {
  it('speaking starts as false', () => {
    const { result } = renderHook(() => useTTS());
    expect(result.current.speaking).toBe(false);
  });

  it('speak() calls speechSynthesis.speak', () => {
    const { result } = renderHook(() => useTTS());
    act(() => { result.current.speak('Hello'); });
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it('speak() calls speechSynthesis.cancel to stop prior speech', () => {
    const { result } = renderHook(() => useTTS());
    act(() => { result.current.speak('text'); });
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });

  it('cancel() calls speechSynthesis.cancel', () => {
    const { result } = renderHook(() => useTTS());
    act(() => { result.current.cancel(); });
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });

  it('onend callback sets speaking to false', () => {
    const { result } = renderHook(() => useTTS());
    const mockSpeak = window.speechSynthesis.speak as ReturnType<typeof vi.fn>;

    let capturedUtterance: any;
    mockSpeak.mockImplementation((u: any) => { capturedUtterance = u; });

    act(() => { result.current.speak('Hello'); });

    // Simulate speaking start
    act(() => { capturedUtterance?.onstart?.(); });
    // speaking is true now
    // Simulate end
    act(() => { capturedUtterance?.onend?.(); });
    expect(result.current.speaking).toBe(false);
  });

  it('onerror callback sets speaking to false', () => {
    const { result } = renderHook(() => useTTS());
    const mockSpeak = window.speechSynthesis.speak as ReturnType<typeof vi.fn>;

    let capturedUtterance: any;
    mockSpeak.mockImplementation((u: any) => { capturedUtterance = u; });

    act(() => { result.current.speak('Hello'); });
    act(() => { capturedUtterance?.onstart?.(); });
    act(() => { capturedUtterance?.onerror?.(new Event('error')); });
    expect(result.current.speaking).toBe(false);
  });

  it('speak() sets u.lang to en-IN', () => {
    const { result } = renderHook(() => useTTS());
    const mockSpeak = window.speechSynthesis.speak as ReturnType<typeof vi.fn>;

    let capturedUtterance: any;
    mockSpeak.mockImplementation((u: any) => { capturedUtterance = u; });

    act(() => { result.current.speak('Hello world'); });
    expect(capturedUtterance?.lang).toBe('en-IN');
  });

  it('cancels on unmount', () => {
    const { unmount } = renderHook(() => useTTS());
    unmount();
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });
});

describe('useSTT', () => {
  it('available is true when SpeechRecognition is defined', () => {
    const { result } = renderHook(() => useSTT());
    expect(result.current.available).toBe(true);
  });

  it('transcript starts empty', () => {
    const { result } = renderHook(() => useSTT());
    expect(result.current.transcript).toBe('');
  });

  it('listening starts as false', () => {
    const { result } = renderHook(() => useSTT());
    expect(result.current.listening).toBe(false);
  });

  it('start() sets listening to true', () => {
    const { result } = renderHook(() => useSTT());
    act(() => { result.current.start(); });
    expect(result.current.listening).toBe(true);
  });

  it('stop() sets listening to false', () => {
    const { result } = renderHook(() => useSTT());
    act(() => { result.current.start(); });
    act(() => { result.current.stop(); });
    expect(result.current.listening).toBe(false);
  });

  it('reset() clears the transcript', () => {
    const { result } = renderHook(() => useSTT());
    act(() => { result.current.reset(); });
    expect(result.current.transcript).toBe('');
  });

  it('available is false when no SpeechRecognition constructor', () => {
    const origSR = (window as any).SpeechRecognition;
    const origWSR = (window as any).webkitSpeechRecognition;

    // Property is writable:true — use simple assignment to temporarily hide the constructors
    (window as any).SpeechRecognition = undefined;
    (window as any).webkitSpeechRecognition = undefined;

    const { result } = renderHook(() => useSTT());
    expect(result.current.available).toBe(false);

    // Restore
    (window as any).SpeechRecognition = origSR;
    (window as any).webkitSpeechRecognition = origWSR;
  });
});
