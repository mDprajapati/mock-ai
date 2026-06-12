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

// Indian male voice name patterns (Windows/Edge neural voices, en-IN locale).
// "Microsoft Ravi" ships with Windows 10/11 when Indian English is installed;
// "Microsoft Prabhat" is available on newer Edge/Windows builds.
const INDIAN_MALE_PATTERNS = ['Ravi', 'Prabhat', 'Hemant', 'Kalpana'];

// Fallback priority when no Indian voice is found.
const FALLBACK_VOICE_PRIORITY = [
  'Microsoft Guy',
  'Microsoft David',
  'Google UK English Male',
  'Alex',
  'Microsoft Aria',
  'Microsoft Jenny',
  'Google US English',
  'Microsoft Zira',
];

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  // 1. Prefer Indian English male voices (en-IN locale)
  const inVoices = voices.filter((v) => v.lang.startsWith('en-IN'));
  for (const pattern of INDIAN_MALE_PATTERNS) {
    const match = inVoices.find((v) => v.name.includes(pattern));
    if (match) return match;
  }
  // Any en-IN voice as fallback within the locale
  if (inVoices.length > 0) return inVoices[0];

  // 2. Try Indian-named voices in any English locale
  const enVoices = voices.filter((v) => v.lang.startsWith('en'));
  for (const pattern of INDIAN_MALE_PATTERNS) {
    const match = enVoices.find((v) => v.name.includes(pattern));
    if (match) return match;
  }

  // 3. Generic English fallback chain
  for (const pattern of FALLBACK_VOICE_PRIORITY) {
    const match = enVoices.find((v) => v.name.includes(pattern));
    if (match) return match;
  }

  return enVoices.find((v) => v.lang === 'en-US') ?? enVoices[0];
}

/* ── Text-to-Speech ── */
export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();

    const clean = preprocessForSpeech(text);
    const u = new SpeechSynthesisUtterance(clean);

    // Hint the browser to use an Indian English voice
    u.lang   = 'en-IN';
    // Natural human SDE cadence — slightly slower, flat pitch
    u.rate   = 0.90;
    u.pitch  = 0.95;
    u.volume = 1.0;

    // Voices may not be loaded on first call; try again on voiceschanged
    const applyVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const chosen = pickVoice(voices);
      if (chosen) u.voice = chosen;
    };
    applyVoice();
    if (!u.voice) {
      window.speechSynthesis.addEventListener('voiceschanged', applyVoice, { once: true });
    }

    u.onstart = () => setSpeaking(true);
    u.onend   = () => { setSpeaking(false); onEnd?.(); };
    u.onerror = () => { setSpeaking(false); onEnd?.(); };

    utterRef.current = u;
    window.speechSynthesis.speak(u);
  }, []);

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

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
