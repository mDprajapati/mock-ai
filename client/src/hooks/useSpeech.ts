import { useCallback, useEffect, useRef, useState } from 'react';

// Strip markdown before speaking so the AI doesn't say "asterisk asterisk"
function preprocessForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, 'code block omitted')   // fenced code blocks
    .replace(/`([^`]+)`/g, '$1')                          // inline code
    .replace(/\*\*(.*?)\*\*/g, '$1')                      // bold
    .replace(/\*(.*?)\*/g, '$1')                          // italic
    .replace(/#{1,6}\s+/g, '')                            // headings
    .replace(/\[ADVANCE\]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')                   // markdown links
    .replace(/\n{2,}/g, '. ')                             // paragraph breaks → pause
    .trim();
}

// Indian male voice name patterns (en-IN locale). "Ravi" ships on Windows 10/11
// when Indian English is installed; "Prabhat" is the newer Edge/Azure neural one.
const INDIAN_MALE_PATTERNS = ['Prabhat', 'Ravi', 'Hemant', 'Madhur'];

// A voice is "natural" (neural) if its name carries these markers. These are the
// only browser voices that don't sound robotic, so they always win.
const isNatural = (v: SpeechSynthesisVoice) => /natural|neural|online/i.test(v.name);

// Generic, less-robotic fallbacks (Google network voices first). Deliberately
// avoids "Microsoft David/Zira Desktop", the most robotic local voices.
const FALLBACK_VOICE_PRIORITY = [
  'Google UK English Male',
  'Google US English',
  'Microsoft Guy',
  'Microsoft Aria',
  'Alex',
];

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const enVoices = voices.filter((v) => v.lang.startsWith('en'));
  const inVoices = enVoices.filter((v) => v.lang.startsWith('en-IN'));

  // 1. Best case: a natural/neural Indian voice (e.g. "Microsoft Prabhat Online (Natural)")
  const naturalIndian = inVoices.find(isNatural);
  if (naturalIndian) return naturalIndian;

  // 2. Any natural/neural English voice — still far better than a robotic local one
  const naturalAny = enVoices.find(isNatural);
  if (naturalAny) return naturalAny;

  // 3. A named Indian male voice (legacy Ravi etc. — robotic but at least Indian)
  for (const pattern of INDIAN_MALE_PATTERNS) {
    const match = inVoices.find((v) => v.name.includes(pattern));
    if (match) return match;
  }

  // 4. Any other en-IN voice
  if (inVoices.length > 0) return inVoices[0];

  // 5. Generic English fallback chain (avoids David/Zira)
  for (const pattern of FALLBACK_VOICE_PRIORITY) {
    const match = enVoices.find((v) => v.name.includes(pattern));
    if (match) return match;
  }

  // 6. Last resort: anything English
  return enVoices.find((v) => v.lang === 'en-US') ?? enVoices[0];
}

// ── Server-side neural TTS availability (probed once, shared across hooks) ──
// null = not yet probed, true/false = known. When true we stream natural
// (Azure) audio; otherwise we fall back to the browser's speechSynthesis.
let azureAvailable: boolean | null = null;
let azureProbe: Promise<boolean> | null = null;

function probeAzure(): Promise<boolean> {
  if (azureAvailable !== null) return Promise.resolve(azureAvailable);
  if (!azureProbe) {
    azureProbe = fetch('/api/tts/status')
      .then((r) => (r.ok ? r.json() : { available: false }))
      .then((d: { available?: boolean }) => { azureAvailable = !!d.available; return azureAvailable; })
      .catch(() => { azureAvailable = false; return false; });
  }
  return azureProbe;
}

/* ── Text-to-Speech ── */
export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const reqIdRef = useRef(0); // bumps on every new speak/cancel to void stale async work

  // Probe once on mount so the first interview question can use neural audio.
  useEffect(() => { void probeAzure(); }, []);

  const cleanup = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch { /* ignore */ }
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
  }, []);

  // Browser speechSynthesis path (fallback / when Azure isn't configured).
  const speakBrowser = useCallback((clean: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) { onEnd?.(); return; }
    const u = new SpeechSynthesisUtterance(clean);
    u.lang   = 'en-IN';
    u.rate   = 0.95;
    u.pitch  = 0.95;
    u.volume = 1.0;

    const applyVoice = () => {
      const chosen = pickVoice(window.speechSynthesis.getVoices());
      if (chosen) u.voice = chosen;
    };
    applyVoice();
    if (!u.voice) {
      window.speechSynthesis.addEventListener('voiceschanged', applyVoice, { once: true });
    }

    u.onstart = () => setSpeaking(true);
    u.onend   = () => { setSpeaking(false); onEnd?.(); };
    u.onerror = () => { setSpeaking(false); onEnd?.(); };
    window.speechSynthesis.speak(u);
  }, []);

  // Neural (Azure) path — fetch MP3 from the server and play it. Falls back to
  // the browser voice on any failure so the interview never goes silent.
  const playAzure = useCallback(async (clean: string, onEnd: (() => void) | undefined, myId: number) => {
    let settled = false;
    const settle = (cb?: () => void) => { if (settled) return; settled = true; cb?.(); };
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean }),
      });
      if (myId !== reqIdRef.current) return;
      if (!res.ok) throw new Error(`tts ${res.status}`);
      const blob = await res.blob();
      if (myId !== reqIdRef.current) return;

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      urlRef.current = url;
      const revoke = () => { if (urlRef.current === url) { URL.revokeObjectURL(url); urlRef.current = null; } };

      audio.onplay  = () => { if (myId === reqIdRef.current) setSpeaking(true); };
      audio.onended = () => settle(() => { revoke(); if (myId === reqIdRef.current) setSpeaking(false); onEnd?.(); });
      audio.onerror = () => settle(() => { revoke(); if (myId === reqIdRef.current) speakBrowser(clean, onEnd); });
      await audio.play();
    } catch {
      settle(() => { if (myId === reqIdRef.current) speakBrowser(clean, onEnd); });
    }
  }, [speakBrowser]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    const clean = preprocessForSpeech(text);
    cleanup();
    const myId = ++reqIdRef.current;

    if (azureAvailable === true) {
      void playAzure(clean, onEnd, myId);
    } else {
      // false or not-yet-probed → use the browser voice immediately (never block
      // on the network), and kick off a probe so later turns can upgrade.
      speakBrowser(clean, onEnd);
      if (azureAvailable === null) void probeAzure();
    }
  }, [cleanup, playAzure, speakBrowser]);

  const cancel = useCallback(() => {
    reqIdRef.current++;
    cleanup();
    setSpeaking(false);
  }, [cleanup]);

  useEffect(() => () => { reqIdRef.current++; cleanup(); }, [cleanup]);

  return { speak, cancel, speaking };
}

/* ── Speech-to-Text ── */
type AnyRecognition = any; // eslint-disable-line @typescript-eslint/no-explicit-any

function getSpeechRecognitionConstructor(): (new () => AnyRecognition) | null {
  if (typeof window === 'undefined') return null;
  const w = window as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSTT() {
  const [listening, setListening]     = useState(false);
  const [transcript, setTranscript]   = useState('');
  const [available]                   = useState(() => !!getSpeechRecognitionConstructor());
  const recognitionRef                = useRef<AnyRecognition>(null);

  useEffect(() => {
    const SR = getSpeechRecognitionConstructor();
    if (!SR) return;
    const rec = new SR();
    rec.continuous      = true;
    rec.interimResults  = true;
    rec.lang            = 'en-US';

    rec.onresult = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
      }
      if (finalText) setTranscript((prev) => (prev ? prev + ' ' + finalText : finalText).trim());
    };

    rec.onend   = () => setListening(false);
    rec.onerror = (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (e.error !== 'aborted') console.warn('STT error:', e.error);
      setListening(false);
    };

    recognitionRef.current = rec;
    return () => { try { rec.abort(); } catch { /* ignore */ } };
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current || listening) return;
    setTranscript('');
    try { recognitionRef.current.start(); setListening(true); } catch { /* already started */ }
  }, [listening]);

  const stop  = useCallback(() => {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch { /* ignore */ }
    setListening(false);
  }, []);

  const reset = useCallback(() => setTranscript(''), []);

  return { transcript, listening, available, start, stop, reset };
}
