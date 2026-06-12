import { useEffect, useRef, useState } from 'react';

export type CameraPermission = 'idle' | 'requesting' | 'granted' | 'denied';

export function useCamera(videoRef: React.RefObject<HTMLVideoElement>) {
  const [permission, setPermission] = useState<CameraPermission>('idle');
  const [error, setError] = useState('');
  const streamRef = useRef<MediaStream | null>(null);

  const start = async () => {
    setPermission('requesting');
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setPermission('granted');
    } catch (err: any) {
      setPermission('denied');
      setError(err.name === 'NotAllowedError' ? 'Camera/mic access denied.' : err.message);
    }
  };

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // Auto-start on mount
  useEffect(() => {
    start();
    return () => stop();
  }, []);

  return { permission, error, stream: streamRef.current, stop };
}
