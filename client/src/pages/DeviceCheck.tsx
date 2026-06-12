import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

type PermissionStatus = 'pending' | 'requesting' | 'granted' | 'denied';

export default function DeviceCheck() {
  const navigate = useNavigate();
  const { session } = useSession();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [permission, setPermission] = useState<PermissionStatus>('pending');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!session) navigate('/intake', { replace: true });
  }, [session, navigate]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const requestPermissions = async () => {
    setPermission('requesting');
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPermission('granted');
    } catch (err: any) {
      setPermission('denied');
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Camera/microphone access was denied. Please allow access in your browser settings and reload.');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('No camera or microphone found. Please connect a device and try again.');
      } else {
        setErrorMsg(`Could not access your devices: ${err.message}`);
      }
    }
  };

  const handleStartInterview = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    navigate('/interview');
  };

  const ready = permission === 'granted';

  return (
    <div className="min-h-screen bg-stage flex flex-col relative">
      {/* Ambient backdrop: dim starfield + fixed blurple glow (no motion on task screens) */}
      <div className="starfield opacity-60" aria-hidden="true" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(55%_45%_at_50%_0%,rgba(88,101,242,0.18),transparent_70%)]" aria-hidden="true" />

      {/* Header */}
      <header className="relative z-10 bg-stage/30 backdrop-blur-xl border-b border-white/[0.06] px-6 py-3.5 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 group">
            <span className="w-2.5 h-2.5 rounded-full bg-accent block" />
            <span className="text-ink-secondary font-display text-sm group-hover:text-ink transition-colors">MockInterview</span>
          </button>
          <span className="text-ink-muted text-sm">Device Check</span>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl relative">
          {/* Sparkles framing the title */}
          <span className="absolute -top-8 left-[12%] text-white/70 animate-twinkle hidden md:block" aria-hidden="true">✦</span>
          <span className="absolute -top-2 right-[10%] text-[#ffb3f1]/80 text-xs animate-twinkle [animation-delay:1.2s] hidden md:block" aria-hidden="true">✦</span>

          <div className="text-center mb-7 animate-fade-up">
            <h1 className="font-display uppercase text-2xl mb-1.5">Ready to join?</h1>
            <p className="text-ink-secondary text-sm">Check your audio and video before the interview begins</p>
          </div>

          {/* Card */}
          <div className="bg-white/[0.04] backdrop-blur-sm rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl animate-fade-up anim-delay-1">
            <div className="flex flex-col md:flex-row">

              {/* Left — video preview */}
              <div className="md:w-[58%] bg-stage relative overflow-hidden">
                {/* Blurple wash so the empty preview doesn't read as a dead void */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(65%_70%_at_50%_40%,rgba(88,101,242,0.16),transparent_75%)]" aria-hidden="true" />
                {/* mobile: keep 16:9 ratio; desktop: fill the full height of the card */}
                <div className="relative aspect-video md:aspect-auto md:absolute md:inset-0">
                  {/* Always-mounted so ref is available when stream attaches */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${ready ? 'block' : 'hidden'}`}
                  />

                  {/* Placeholder */}
                  {!ready && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <div className={`relative w-20 h-20 rounded-full bg-raised border border-white/[0.06] flex items-center justify-center ${permission === 'requesting' ? '' : 'animate-float'}`}>
                        {permission === 'requesting' && (
                          <span className="absolute -inset-1 rounded-full speaking-ring" aria-hidden="true" />
                        )}
                        <svg className="w-9 h-9 text-ink-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                        </svg>
                      </div>
                      <p className="text-ink-muted text-sm">
                        {permission === 'requesting' ? 'Requesting camera access…' : 'Camera is off'}
                      </p>
                    </div>
                  )}

                  {/* Live indicator */}
                  {ready && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse block" />
                      <span className="text-ink text-xs font-medium">Preview</span>
                    </div>
                  )}

                  {/* Device status pills (bottom of video) */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
                      ready
                        ? 'bg-black/60 border-accent/40 text-accent-bright'
                        : 'bg-black/40 border-white/10 text-ink-muted'
                    }`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                      </svg>
                      Camera
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
                      ready
                        ? 'bg-black/60 border-accent/40 text-accent-bright'
                        : 'bg-black/40 border-white/10 text-ink-muted'
                    }`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                      </svg>
                      Mic
                    </div>
                  </div>
                </div>
              </div>

              {/* Right — settings + join */}
              <div className="md:w-[42%] p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/[0.06]">
                <div className="space-y-4">
                  <div className="mb-2">
                    <h2 className="font-display uppercase text-base">Join Interview</h2>
                    <p className="text-ink-muted text-xs mt-1">Confirm your devices are working</p>
                  </div>

                  {/* Camera row */}
                  <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                    ready ? 'border-accent/35 bg-accent/[0.07]' : 'border-white/[0.06] bg-raised'
                  }`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      ready ? 'bg-accent/20' : 'bg-overlay'
                    }`}>
                      <svg className={`w-4 h-4 transition-colors ${ready ? 'text-accent-bright' : 'text-ink-muted'}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium transition-colors ${ready ? 'text-ink' : 'text-ink-secondary'}`}>Camera</p>
                      <p className="text-xs text-ink-muted">{ready ? 'Connected & ready' : 'Awaiting permission'}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${ready ? 'bg-emerald-400 animate-pop-in shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-white/15'}`} />
                  </div>

                  {/* Microphone row */}
                  <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                    ready ? 'border-accent/35 bg-accent/[0.07]' : 'border-white/[0.06] bg-raised'
                  }`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      ready ? 'bg-accent/20' : 'bg-overlay'
                    }`}>
                      <svg className={`w-4 h-4 transition-colors ${ready ? 'text-accent-bright' : 'text-ink-muted'}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium transition-colors ${ready ? 'text-ink' : 'text-ink-secondary'}`}>Microphone</p>
                      <p className="text-xs text-ink-muted">{ready ? 'Connected & ready' : 'Awaiting permission'}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${ready ? 'bg-emerald-400 animate-pop-in shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-white/15'}`} />
                  </div>

                  {/* Screen share info */}
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.05] bg-raised">
                    <div className="w-9 h-9 rounded-full bg-overlay flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-secondary">Screen share — Phase 3</p>
                      <p className="text-xs text-ink-muted mt-0.5">A button will appear when needed</p>
                    </div>
                  </div>

                  {/* Error */}
                  {errorMsg && (
                    <div className="p-3 rounded-xl border border-danger/25 bg-danger/[0.08] animate-slide-in">
                      <p className="text-danger-bright text-xs leading-relaxed">{errorMsg}</p>
                    </div>
                  )}
                </div>

                {/* CTA buttons */}
                <div className="mt-6 space-y-2.5">
                  {!ready && (
                    <button
                      onClick={requestPermissions}
                      disabled={permission === 'requesting'}
                      className="w-full py-2.5 bg-accent hover:bg-accent-bright active:bg-accent-deep active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed text-accent-ink font-semibold text-sm rounded-xl transition-all duration-150"
                    >
                      {permission === 'requesting' ? 'Requesting access…' : 'Allow Camera & Microphone'}
                    </button>
                  )}

                  <button
                    onClick={handleStartInterview}
                    disabled={!ready}
                    className={`w-full py-2.5 font-semibold text-sm rounded-xl transition-all duration-200 ${
                      ready
                        ? 'bg-accent hover:bg-accent-bright active:bg-accent-deep active:scale-[0.97] text-accent-ink glow-accent hover:-translate-y-0.5'
                        : 'bg-raised text-ink-muted cursor-not-allowed'
                    }`}
                  >
                    Join now →
                  </button>

                  <p className="text-center text-ink-muted text-[11px]">
                    Video and audio are used only for this session
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
