import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSession } from '../context/SessionContext';
import { useTTS, useSTT } from '../hooks/useSpeech';
import { useCamera } from '../hooks/useCamera';
import { useInterviewPhase } from '../hooks/useInterviewPhase';
import { CodeGround } from '../components/CodeGround';
import { JSCodeGround } from '../components/JSCodeGround';
import { PhaseAdvanceModal } from '../components/PhaseAdvanceModal';
import { EndConfirmModal } from '../components/EndConfirmModal';
import { TranscriptEntry, Phase, PHASE_NAMES, PHASE_DURATIONS, EvaluationReport, JSExercise } from '../types';

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

type Status = 'loading' | 'ai_speaking' | 'candidate_turn' | 'processing' | 'phase_transition' | 'evaluating' | 'error';

const WAVEFORM_HEIGHTS = [40, 70, 55, 90, 65, 80, 45, 100, 60, 75, 50, 85, 40, 95, 70, 55, 80, 65, 90, 50];

export default function Interview() {
  const navigate = useNavigate();
  const { session } = useSession();

  const videoRef       = useRef<HTMLVideoElement>(null);
  const transcriptRef  = useRef<HTMLDivElement>(null);

  const { stop: stopCamera } = useCamera(videoRef);
  const [cameraOn, setCameraOn] = useState(true);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const toggleCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (stream) {
      stream.getVideoTracks().forEach(t => { t.enabled = !cameraOn; });
      setCameraOn(prev => !prev);
    }
  };

  const { speak, cancel: cancelTTS, speaking: aiSpeaking } = useTTS();
  const { transcript: sttText, listening, available: sttAvailable, start: startSTT, stop: stopSTT, reset: resetSTT } = useSTT();

  const [phase, setPhase]                           = useState<Phase>(1);
  const [transcript, setTranscript]                 = useState<TranscriptEntry[]>([]);
  const [currentQuestion, setCurrentQuestion]       = useState('');
  const [status, setStatus]                         = useState<Status>('loading');
  const [phaseTransitionMsg, setPhaseTransitionMsg] = useState('');
  const [showTextInput, setShowTextInput]           = useState(false);
  const [errorMsg, setErrorMsg]                     = useState('');
  const [typingAnswer, setTypingAnswer]             = useState('');

  const [showCodeGround, setShowCodeGround]         = useState(false);
  const [codingChallenge, setCodingChallenge]       = useState('');

  const [showJSEditor, setShowJSEditor]             = useState(false);
  const [phase2Exercises, setPhase2Exercises]       = useState<JSExercise[]>([]);
  const [activeTaskIndex, setActiveTaskIndex]       = useState(0);
  const phase2ExercisesRef                          = useRef<JSExercise[]>([]);
  useEffect(() => { phase2ExercisesRef.current = phase2Exercises; }, [phase2Exercises]);

  const phaseRef       = useRef<Phase>(1);
  const transcriptRef2    = useRef<TranscriptEntry[]>([]);
  const statusRef         = useRef<Status>('loading');
  const initialLoadFired  = useRef(false);
  // Forward ref so useInterviewPhase can call handlePhaseEnd without a circular dep
  const handlePhaseEndRef = useRef<() => void>(() => {});

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { transcriptRef2.current = transcript; }, [transcript]);
  useEffect(() => { statusRef.current = status; }, [status]);

  const {
    timeLeft,
    setTimeLeft,
    showAdvanceModal,
    setShowAdvanceModal,
    advanceCountdown,
    pendingNextPhaseRef,
    advanceCountdownRef,
    startAdvanceCountdown,
  } = useInterviewPhase(status, phase, { onPhaseEnd: () => handlePhaseEndRef.current() });

  useEffect(() => {
    if (!session) navigate('/intake', { replace: true });
  }, [session, navigate]);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  /* ── Execute phase transition ── */
  const doPhaseTransition = useCallback((nextPhase: Phase, currentTranscript: TranscriptEntry[]) => {
    if (advanceCountdownRef.current) clearInterval(advanceCountdownRef.current);
    setShowAdvanceModal(false);
    setPhaseTransitionMsg(`Phase ${nextPhase - 1} complete! Moving to Phase ${nextPhase}: ${PHASE_NAMES[nextPhase]}…`);
    setStatus('phase_transition');
    setTimeout(() => {
      setPhase(nextPhase);
      phaseRef.current = nextPhase;
      setTimeLeft(PHASE_DURATIONS[nextPhase]);
      setPhaseTransitionMsg('');
      loadQuestion(nextPhase, currentTranscript); // eslint-disable-line @typescript-eslint/no-use-before-define
    }, 2500);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Auto-advance when countdown hits 0 ── */
  useEffect(() => {
    if (advanceCountdown === 0 && showAdvanceModal && pendingNextPhaseRef.current) {
      doPhaseTransition(pendingNextPhaseRef.current, transcriptRef2.current);
    }
  }, [advanceCountdown, showAdvanceModal, doPhaseTransition]);

  /* ── Fetch next question ── */
  const loadQuestion = useCallback(async (p: Phase, t: TranscriptEntry[]) => {
    setStatus('loading');
    setErrorMsg('');

    let exercises = phase2ExercisesRef.current;
    if (p === 2 && exercises.length === 0) {
      try {
        const { data: exData } = await axios.get('/api/phase2/exercises', {
          params: { experience: session?.experience || '0-2', count: 4 },
        });
        exercises = exData.exercises as JSExercise[];
        setPhase2Exercises(exercises);
        phase2ExercisesRef.current = exercises;
      } catch {
        // proceed without exercises
      }
    }

    try {
      const { data } = await axios.post('/api/interview/message', {
        session,
        transcript: t,
        phase: p,
        jsExercises: p === 2 ? exercises : undefined,
      });
      const q: string = data.question;
      const shouldAdvance: boolean = data.advancePhase ?? false;

      setCurrentQuestion(q);

      if (p === 2 && typeof data.activeTaskIndex === 'number') {
        setActiveTaskIndex(data.activeTaskIndex);
      }

      if (p === 3 && !codingChallenge) setCodingChallenge(q);

      const newEntry: TranscriptEntry = { role: 'ai', text: q, phase: p, timestamp: Date.now() };
      const updated = [...t, newEntry];
      setTranscript(updated);
      transcriptRef2.current = updated;

      setStatus('ai_speaking');
      speak(q, () => {
        if (shouldAdvance && p < 3) {
          startAdvanceCountdown((p + 1) as Phase);
        } else {
          setStatus('candidate_turn');
          resetSTT();
          if (sttAvailable) startSTT();
        }
      });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to get question. Check your API key and server.');
      setStatus('error');
    }
  }, [session, speak, sttAvailable, startSTT, resetSTT, codingChallenge, startAdvanceCountdown]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (session && !initialLoadFired.current) {
      initialLoadFired.current = true;
      loadQuestion(1, []);
    }
  }, [session]);

  /* ── Submit candidate answer ── */
  const submitAnswer = useCallback((answer: string) => {
    const trimmed = answer.trim();
    if (!trimmed) return;
    stopSTT();
    cancelTTS();

    const entry: TranscriptEntry = {
      role: 'candidate',
      text: trimmed,
      phase: phaseRef.current,
      timestamp: Date.now(),
    };
    const updated = [...transcriptRef2.current, entry];
    setTranscript(updated);
    transcriptRef2.current = updated;
    resetSTT();
    setTypingAnswer('');

    loadQuestion(phaseRef.current, updated);
  }, [stopSTT, cancelTTS, loadQuestion, resetSTT]);

  /* ── Phase end (timer) ── */
  const handlePhaseEnd = useCallback(() => {
    stopSTT();
    cancelTTS();
    const currentPhase = phaseRef.current;

    if (currentPhase < 3) {
      doPhaseTransition((currentPhase + 1) as Phase, transcriptRef2.current);
    } else {
      evaluateInterview(transcriptRef2.current); // eslint-disable-line @typescript-eslint/no-use-before-define
    }
  }, [stopSTT, cancelTTS, doPhaseTransition]);

  // Keep the forward ref in sync with the latest handlePhaseEnd
  useEffect(() => { handlePhaseEndRef.current = handlePhaseEnd; }, [handlePhaseEnd]);

  /* ── Final evaluation ── */
  const evaluateInterview = async (t: TranscriptEntry[]) => {
    stopSTT();
    cancelTTS();
    if (advanceCountdownRef.current) clearInterval(advanceCountdownRef.current);
    setShowAdvanceModal(false);
    setStatus('evaluating');
    try {
      const { data } = await axios.post('/api/evaluate', { session, transcript: t });
      const report: EvaluationReport = data.report;
      stopCamera();
      navigate('/report', { state: { report } });
    } catch {
      stopCamera();
      navigate('/');
    }
  };

  if (!session) return null;

  const timerRed = timeLeft <= 60;
  const isSpeaking = aiSpeaking || status === 'ai_speaking';

  const canAnswer = status === 'candidate_turn' || status === 'ai_speaking' || listening;

  return (
    <>
      {/* ── Full-screen code editors (overlays) ── */}
      {showJSEditor && phase2Exercises.length > 0 && (
        <JSCodeGround
          exercises={phase2Exercises}
          activeIndex={activeTaskIndex}
          onClose={() => setShowJSEditor(false)}
        />
      )}
      {showCodeGround && (
        <CodeGround
          challenge={codingChallenge || currentQuestion}
          onClose={() => setShowCodeGround(false)}
        />
      )}

      <div className="h-screen bg-stage flex flex-col overflow-hidden relative">
        {/* Ambient backdrop: very dim starfield (static — the interview stays calm) */}
        <div className="starfield opacity-30" aria-hidden="true" />

        {/* ══ Header bar ══ */}
        <header className="relative flex-shrink-0 h-12 bg-surface/70 backdrop-blur-xl border-b border-white/[0.06] flex items-center px-4 gap-3 z-10">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-accent block" />
            <span className="text-ink-secondary font-display text-xs hidden sm:block">MockInterview</span>
          </div>

          <div className="w-px h-4 bg-white/10 mx-0.5 flex-shrink-0" />

          {/* Phase badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-accent/40 text-ink bg-gradient-to-r from-accent/25 to-[#d84fd8]/20 flex-shrink-0">
            <span>Phase {phase}</span>
            <span className="text-white/20">·</span>
            <span className="opacity-80">{PHASE_NAMES[phase]}</span>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold flex-shrink-0 ${
            timerRed ? 'text-danger-bright bg-danger/10' : 'text-ink-secondary bg-white/[0.04]'
          }`}>
            {timerRed && <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse block" />}
            {formatTime(timeLeft)}
          </div>

          <div className="flex-1" />

          {/* Editor shortcuts (header) */}
          {phase === 2 && phase2Exercises.length > 0 && (
            <button
              onClick={() => setShowJSEditor(true)}
              className="flex items-center gap-1.5 text-xs text-accent-bright bg-accent/10 hover:bg-accent/20 border border-accent/25 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              JS Editor
            </button>
          )}
          {phase === 3 && (
            <button
              onClick={() => setShowCodeGround(true)}
              className="flex items-center gap-1.5 text-xs text-accent-bright bg-accent/10 hover:bg-accent/20 border border-accent/25 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Code Editor
            </button>
          )}

          <button
            onClick={() => setShowEndConfirm(true)}
            className="flex-shrink-0 text-xs text-ink-muted hover:text-ink-secondary border border-white/[0.08] hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            End Early
          </button>
        </header>

        {/* ══ Main layout ══ */}
        <div className="flex-1 flex overflow-hidden">

          {/* ── Stage: AI tile + candidate PiP ── */}
          <div className="flex-1 relative flex items-center justify-center p-5 min-w-0">
            {/* Soft blurple stage light behind the AI tile */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(50%_55%_at_50%_35%,rgba(88,101,242,0.13),transparent_70%)]" aria-hidden="true" />

            {/* AI participant tile */}
            <div className={`w-full max-w-2xl rounded-3xl border overflow-hidden bg-surface/90 backdrop-blur-sm transition-all duration-300 ${
              isSpeaking ? 'border-accent/50 animate-glow-pulse' : 'border-white/10'
            }`}
              style={{ aspectRatio: '16/9' }}
            >
              {/* AI avatar area */}
              <div className="w-full h-full flex flex-col items-center justify-center gap-5 relative px-8">
                {/* Inner glow framing the interviewer */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(45%_55%_at_50%_38%,rgba(88,101,242,0.18),transparent_72%)]" aria-hidden="true" />

                {/* Pulsing ring + avatar */}
                <div className="relative flex items-center justify-center">
                  {isSpeaking && (
                    <>
                      <span className="absolute w-28 h-28 rounded-full bg-accent/10 animate-ping" />
                      <span className="absolute -inset-2 w-24 h-24 rounded-full speaking-ring" />
                    </>
                  )}
                  {(status === 'loading' || status === 'processing') && (
                    <span className="absolute -inset-2 w-24 h-24 rounded-full speaking-ring opacity-60" />
                  )}
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center relative z-10 transition-all duration-300 ${
                    isSpeaking
                      ? 'bg-accent/25 border-2 border-accent shadow-[0_0_24px_rgba(88,101,242,0.5)]'
                      : 'bg-raised border-2 border-white/10 animate-breathe'
                  }`}>
                    <span className={`font-display font-bold text-xl transition-colors ${isSpeaking ? 'text-accent-bright' : 'text-ink-muted'}`}>AI</span>
                  </div>
                </div>

                {/* Question text / loading skeleton */}
                <div className="text-center max-w-lg w-full">
                  {status === 'loading' || status === 'processing' ? (
                    <div className="space-y-2.5 flex flex-col items-center">
                      <div className="h-3 rounded-full skeleton-shimmer w-3/4" />
                      <div className="h-3 rounded-full skeleton-shimmer w-full" />
                      <div className="h-3 rounded-full skeleton-shimmer w-2/3" />
                    </div>
                  ) : (
                    <p className="text-ink-secondary text-sm leading-relaxed">
                      {currentQuestion || 'Preparing your interview…'}
                    </p>
                  )}
                </div>

                {/* Speaking waveform */}
                {isSpeaking && (
                  <div className="flex items-end gap-0.5 h-7">
                    {WAVEFORM_HEIGHTS.map((h, i) => (
                      <div
                        key={i}
                        className="w-1 bg-accent-bright rounded-full animate-wave origin-bottom shadow-[0_0_6px_rgba(121,131,245,0.6)]"
                        style={{
                          height: `${h}%`,
                          animationDelay: `${i * 0.06}s`,
                          animationDuration: `${0.6 + (i % 4) * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Name badge (bottom-left of tile) */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1">
                  {isSpeaking && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse block" />}
                  <span className="text-ink text-xs font-medium">AI Interviewer</span>
                  {status !== 'candidate_turn' && (
                    <>
                      <span className="text-white/20 text-xs">·</span>
                      {status === 'loading' || status === 'processing' ? (
                        <span className="flex items-center gap-1.5">
                          <span className="text-ink-muted text-xs">{status === 'loading' ? 'Thinking' : 'Processing'}</span>
                          <span className="flex items-center gap-0.5">
                            {[0, 1, 2].map((d) => (
                              <span
                                key={d}
                                className="w-1 h-1 rounded-full bg-accent animate-dot-bounce"
                                style={{ animationDelay: `${d * 0.15}s` }}
                              />
                            ))}
                          </span>
                        </span>
                      ) : (
                        <span className="text-ink-muted text-xs">
                          {isSpeaking ? 'Speaking…' : status === 'evaluating' ? 'Evaluating…' : ''}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Candidate PiP — bottom-right */}
            <div className="absolute bottom-5 right-5 w-36 xl:w-44 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-raised"
              style={{ aspectRatio: '16/9' }}
            >
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-black/70 rounded-md px-1.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-danger-bright animate-pulse block" />
                <span className="text-ink text-[10px] font-medium">You</span>
              </div>
            </div>
          </div>

          {/* ── Right panel: Transcript + answer input ── */}
          <div className="relative w-[320px] xl:w-[360px] flex-shrink-0 flex flex-col bg-surface/80 backdrop-blur-sm border-l border-white/[0.06]">

            {/* Panel header */}
            <div className="px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
              <h3 className="text-ink-muted text-xs font-semibold uppercase tracking-widest">Transcript</h3>
            </div>

            {/* Messages */}
            <div ref={transcriptRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {transcript.length === 0 ? (
                <p className="text-ink-muted/60 text-xs text-center mt-6">Conversation will appear here…</p>
              ) : (
                transcript.map((entry, i) => (
                  <div key={i} className={`flex gap-2 animate-slide-in ${entry.role === 'ai' ? 'items-start' : 'items-start justify-end'}`}>
                    {entry.role === 'ai' && (
                      <div className="w-5 h-5 rounded-full bg-accent/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-accent-bright text-[8px] font-bold">AI</span>
                      </div>
                    )}
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      entry.role === 'ai'
                        ? 'bg-raised text-ink-secondary'
                        : 'bg-accent/[0.12] border border-accent/25 text-ink-secondary'
                    }`}>
                      {entry.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Answer input */}
            <div className="border-t border-white/[0.06] p-3 flex-shrink-0">
              {canAnswer ? (
                <div className="space-y-2">
                  {showTextInput || !sttAvailable ? (
                    <textarea
                      className="w-full bg-raised border border-white/[0.08] focus:border-accent/50 rounded-xl px-3 py-2.5 text-xs text-ink placeholder-ink-muted resize-none outline-none transition-colors"
                      rows={3}
                      placeholder="Type your answer…"
                      value={typingAnswer}
                      onChange={(e) => setTypingAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAnswer(typingAnswer); }
                      }}
                    />
                  ) : (
                    <div className={`w-full bg-raised border rounded-xl px-3 py-2.5 text-xs min-h-[4.5rem] transition-colors ${
                      listening ? 'border-accent/50' : 'border-white/[0.08]'
                    }`}>
                      {sttText
                        ? <span className="text-ink">{sttText}</span>
                        : <span className="text-ink-muted/70">{listening ? 'Listening… speak your answer' : 'Press mic to start speaking'}</span>
                      }
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    {sttAvailable && !showTextInput && (
                      <button
                        onClick={() => { listening ? stopSTT() : (resetSTT(), startSTT()); }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                          listening ? 'bg-danger/20 text-danger-bright border border-danger/30' : 'bg-raised hover:bg-overlay text-ink-muted'
                        }`}
                        title={listening ? 'Stop' : 'Speak'}
                      >
                        {listening ? (
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                          </svg>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => submitAnswer(showTextInput || !sttAvailable ? typingAnswer : sttText)}
                      disabled={!(showTextInput || !sttAvailable ? typingAnswer.trim() : sttText.trim())}
                      className="flex-1 h-8 bg-accent hover:bg-accent-bright active:bg-accent-deep active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed text-accent-ink text-xs font-semibold rounded-lg transition-all duration-150"
                    >
                      Send
                    </button>

                    {sttAvailable && (
                      <button
                        onClick={() => setShowTextInput((v) => !v)}
                        className="w-8 h-8 rounded-lg bg-raised hover:bg-overlay text-ink-muted flex items-center justify-center transition-colors flex-shrink-0"
                        title={showTextInput ? 'Switch to voice' : 'Switch to text'}
                      >
                        {showTextInput ? (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ) : status === 'loading' || status === 'processing' ? (
                <div className="flex items-center gap-2 text-ink-muted text-xs py-1.5">
                  <div className="w-3 h-3 border border-accent/40 border-t-accent rounded-full animate-spin flex-shrink-0" />
                  {status === 'processing' ? 'AI preparing next question…' : 'Connecting to AI interviewer…'}
                </div>
              ) : status === 'evaluating' ? (
                <div className="flex items-center gap-2 text-ink-muted text-xs py-1.5">
                  <div className="w-3 h-3 border border-emerald-500/40 border-t-emerald-500 rounded-full animate-spin flex-shrink-0" />
                  Generating your performance report…
                </div>
              ) : status === 'error' ? (
                <div className="space-y-2">
                  <p className="text-danger-bright text-xs leading-relaxed">{errorMsg}</p>
                  <button
                    onClick={() => loadQuestion(phase, transcript)}
                    className="w-full py-1.5 bg-danger/15 hover:bg-danger/25 border border-danger/25 text-danger-bright text-xs rounded-lg transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* ══ Control bar ══ */}
        <div className="relative flex-shrink-0 h-16 bg-surface/70 backdrop-blur-xl border-t border-white/[0.06] flex items-center justify-center gap-3 px-6">

          {/* Mic — toggles STT during candidate turn */}
          <button
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 ${
              listening ? 'bg-danger text-white shadow-[0_0_20px_rgba(229,72,77,0.4)] animate-pulse-slow' : 'bg-raised hover:bg-overlay text-ink-secondary'
            }`}
            onClick={() => {
              if (status === 'candidate_turn' || listening) {
                listening ? stopSTT() : (resetSTT(), startSTT());
              }
            }}
            title={listening ? 'Stop listening' : status === 'candidate_turn' ? 'Start speaking' : 'Mic (active during your turn)'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
            </svg>
          </button>

          {/* Camera — toggles video track on/off */}
          <button
            onClick={toggleCamera}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 ${
              cameraOn ? 'bg-raised hover:bg-overlay text-ink-secondary' : 'bg-danger text-white shadow-[0_0_20px_rgba(229,72,77,0.4)]'
            }`}
            title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {cameraOn ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8zM3 3l18 18" />
              </svg>
            )}
          </button>

          {/* Phase-specific editor buttons */}
          {phase === 2 && phase2Exercises.length > 0 && (
            <button
              onClick={() => setShowJSEditor(true)}
              className="h-10 px-4 rounded-full bg-accent/10 hover:bg-accent/20 border border-accent/25 text-accent-bright text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              JS Editor
            </button>
          )}
          {phase === 3 && (
            <button
              onClick={() => setShowCodeGround(true)}
              className="h-10 px-4 rounded-full bg-accent/10 hover:bg-accent/20 border border-accent/25 text-accent-bright text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Code Editor
            </button>
          )}

          <div className="w-px h-7 bg-white/[0.08] mx-1" />

          {/* End call */}
          <button
            onClick={() => setShowEndConfirm(true)}
            className="h-10 px-5 rounded-full bg-danger hover:bg-danger-bright text-white text-xs font-semibold flex items-center gap-2 transition-all duration-150 hover:scale-[1.03] active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 11.504A9.998 9.998 0 0112 2c2.29 0 4.408.772 6.1 2.063" />
            </svg>
            End Interview
          </button>
        </div>

        {/* ══ Phase transition overlay ══ */}
        {status === 'phase_transition' && (
          <div className="absolute inset-0 bg-stage/95 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="text-center animate-scale-in">
              <div className="relative w-16 h-16 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-5">
                <span className="absolute -inset-1 rounded-full speaking-ring" aria-hidden="true" />
                <svg className="w-7 h-7 text-accent-bright" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xl font-semibold mb-2">{phaseTransitionMsg}</p>
              <p className="text-ink-muted text-sm">Get ready for the next phase…</p>
            </div>
          </div>
        )}

        {/* ══ Phase advance modal ══ */}
        {showAdvanceModal && pendingNextPhaseRef.current && (
          <PhaseAdvanceModal
            currentPhase={phase}
            nextPhase={pendingNextPhaseRef.current}
            countdown={advanceCountdown}
            onContinue={() => doPhaseTransition(pendingNextPhaseRef.current!, transcriptRef2.current)}
            onStay={() => {
              if (advanceCountdownRef.current) clearInterval(advanceCountdownRef.current);
              setShowAdvanceModal(false);
              setStatus('candidate_turn');
              resetSTT();
              if (sttAvailable) startSTT();
            }}
          />
        )}
        {/* ══ End interview confirm modal ══ */}
        {showEndConfirm && (
          <EndConfirmModal
            onConfirm={() => { setShowEndConfirm(false); evaluateInterview(transcript); }}
            onCancel={() => setShowEndConfirm(false)}
          />
        )}

      </div>
    </>
  );
}
