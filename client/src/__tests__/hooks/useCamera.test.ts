import { renderHook, waitFor } from '@testing-library/react';
import { useCamera } from '../../hooks/useCamera';

function makeVideoRef(el: HTMLVideoElement | null = null) {
  return { current: el };
}

describe('useCamera', () => {
  const mockStop = vi.fn();
  const mockStream = {
    getTracks: () => [{ stop: mockStop }],
    getVideoTracks: () => [{ stop: mockStop }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockResolvedValue(mockStream);
  });

  it('starts with "requesting" permission after mount', async () => {
    const videoRef = makeVideoRef();
    const { result } = renderHook(() => useCamera(videoRef as any));
    // starts requesting immediately
    expect(['idle', 'requesting']).toContain(result.current.permission);
  });

  it('calls getUserMedia with video and audio', async () => {
    const videoRef = makeVideoRef();
    renderHook(() => useCamera(videoRef as any));
    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: true,
        audio: true,
      });
    });
  });

  it('sets permission to "granted" on success', async () => {
    const videoRef = makeVideoRef();
    const { result } = renderHook(() => useCamera(videoRef as any));
    await waitFor(() => expect(result.current.permission).toBe('granted'));
  });

  it('sets permission to "denied" on NotAllowedError', async () => {
    const err = new Error('denied');
    err.name = 'NotAllowedError';
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValue(err);
    const videoRef = makeVideoRef();
    const { result } = renderHook(() => useCamera(videoRef as any));
    await waitFor(() => expect(result.current.permission).toBe('denied'));
    expect(result.current.error).toBe('Camera/mic access denied.');
  });

  it('sets error message on NotFoundError', async () => {
    const err = new Error('not found');
    err.name = 'NotFoundError';
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValue(err);
    const videoRef = makeVideoRef();
    const { result } = renderHook(() => useCamera(videoRef as any));
    await waitFor(() => expect(result.current.permission).toBe('denied'));
    expect(result.current.error).toBe('not found');
  });

  it('stops tracks on cleanup', async () => {
    const videoRef = makeVideoRef();
    const { unmount } = renderHook(() => useCamera(videoRef as any));
    await waitFor(() => {});
    unmount();
    expect(mockStop).toHaveBeenCalled();
  });

  it('sets video srcObject when videoRef is provided', async () => {
    const videoEl = document.createElement('video');
    videoEl.play = vi.fn().mockResolvedValue(undefined);
    const videoRef = { current: videoEl };
    renderHook(() => useCamera(videoRef as any));
    await waitFor(() => {
      expect(videoEl.srcObject).toBe(mockStream);
    });
  });
});
