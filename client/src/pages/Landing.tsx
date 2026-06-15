import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CodeIcon, SalesIcon, MarketingIcon, ArrowRight, LockIcon } from '../components/icons';

type Mode = 'claude' | 'local';

interface ModeInfo {
  mode: Mode;
  model: string;
  requiresKey: boolean;
  claudeKeyAvailable: boolean;
  localAvailable?: boolean;
}

const MARQUEE_TOPICS = [
  'React', 'TypeScript', 'System Design', 'Node.js', 'SQL', 'Algorithms',
  'REST APIs', 'Testing', 'CSS', 'Behavioral', 'Git', 'Cloud & DevOps',
];

/* Reveal-on-scroll: content is visible by default; entering the viewport only
   ADDS the entrance animation, so nothing ships blank if the observer never fires. */
function useInViewOnce<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.18 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

/* A decorative element that bobs continuously and drifts with the cursor.
   Outer div carries the smoothed parallax offset; inner span runs the
   looping animation so the two transforms don't fight. */
function Floaty({ className, depth, par, anim, children }: {
  className: string;
  depth: number;
  par: { x: number; y: number };
  anim: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`absolute pointer-events-none select-none ${className}`}
      aria-hidden="true"
      style={{
        transform: `translate3d(${par.x * depth}px, ${par.y * depth}px, 0)`,
        transition: 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)',
      }}
    >
      <span className={`block ${anim}`}>{children}</span>
    </div>
  );
}

/* One "how it works" panel: glassy rounded container, gradient art block on one
   side, step copy on the other. `flip` mirrors the layout for alternating rhythm. */
function StepSection({ step, title, desc, points, art, artGradient, flip }: {
  step: number;
  title: string;
  desc: string;
  points: string[];
  art: ReactNode;
  artGradient: string;
  flip?: boolean;
}) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`relative bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-[2.5rem] p-6 md:p-10 overflow-hidden ${inView ? 'animate-fade-up' : ''}`}
    >
      <div className={`flex flex-col gap-8 md:gap-12 md:items-center ${flip ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
        <div className="md:w-1/2 w-full">
          <div className={`rounded-3xl p-6 md:p-8 ${artGradient}`}>{art}</div>
        </div>
        <div className="md:w-1/2 w-full">
          <span className="inline-block bg-white/10 border border-white/15 text-ink text-xs font-bold tracking-widest rounded-full px-3 py-1 mb-4">
            STEP {step}
          </span>
          <h2 className="font-display uppercase text-2xl md:text-[2.5rem] leading-[1.1] mb-4">{title}</h2>
          <p className="text-ink-secondary leading-relaxed mb-5 max-w-md">{desc}</p>
          <ul className="space-y-2">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-ink-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-bright flex-shrink-0 mt-1.5" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ── CSS-built product illustrations for the step panels ── */

function Step1Art() {
  return (
    <div className="relative max-w-sm mx-auto">
      <div className="bg-stage/85 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="bg-danger/90 text-white text-[10px] font-bold rounded px-1.5 py-0.5">PDF</span>
          <span className="text-ink text-xs font-medium">anita_dev_cv.pdf</span>
          <span className="ml-auto text-emerald-400 text-sm animate-pop-in">✓</span>
        </div>
        <div className="space-y-2.5">
          <div className="h-2 rounded-full bg-white/20 w-3/4" />
          <div className="h-2 rounded-full bg-white/12 w-full" />
          <div className="h-2 rounded-full bg-accent-bright/60 w-1/2" />
          <div className="h-2 rounded-full bg-white/12 w-5/6" />
          <div className="h-2 rounded-full bg-white/12 w-2/3" />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="bg-white/10 border border-white/15 text-ink-secondary text-[10px] rounded-full px-2 py-0.5">React</span>
          <span className="bg-white/10 border border-white/15 text-ink-secondary text-[10px] rounded-full px-2 py-0.5">Node.js</span>
          <span className="bg-white/10 border border-white/15 text-ink-secondary text-[10px] rounded-full px-2 py-0.5">5 yrs</span>
        </div>
      </div>
      <div className="absolute -top-3 -right-3 bg-white text-stage text-xs font-bold rounded-full px-3 py-1.5 shadow-xl animate-bob">
        ⬆ Upload CV
      </div>
      <div className="absolute -bottom-3 -left-3 bg-stage/90 border border-white/15 text-ink-secondary text-[11px] rounded-full px-3 py-1.5 shadow-xl animate-bob [animation-delay:1.2s]">
        + Job description
      </div>
    </div>
  );
}

function Step2Art() {
  const tiles = [
    { name: 'You', bg: 'bg-[#5865f2]', initial: 'Y', live: true },
    { name: 'AI Interviewer', bg: 'bg-[#d984dd]', initial: 'AI', live: false },
    { name: 'Camera', bg: 'bg-[#8be99e]', initial: '◉', live: false },
    { name: 'Mic', bg: 'bg-[#9fc3fa]', initial: '♪', live: false },
  ];
  return (
    <div className="max-w-sm mx-auto">
      <div className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-3.5 py-2 w-max mb-4 text-white text-sm font-semibold shadow-lg">
        <span className="text-base">🔊</span> device-check
      </div>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <div
            key={t.name}
            className={`relative rounded-xl ${t.bg} aspect-video flex items-center justify-center shadow-lg ${
              t.live ? 'ring-2 ring-white' : ''
            }`}
          >
            <span className="w-9 h-9 rounded-full bg-black/25 text-white text-xs font-bold flex items-center justify-center">
              {t.initial}
            </span>
            <span className="absolute bottom-1.5 left-1.5 bg-black/45 text-white text-[9px] font-medium rounded px-1.5 py-0.5">
              {t.name}
            </span>
            {t.live && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-300 animate-pulse-slow" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Step3Art() {
  return (
    <div className="bg-stage/85 rounded-2xl p-4 max-w-sm mx-auto space-y-3 shadow-2xl">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3].map((p) => (
          <span
            key={p}
            className={`text-[10px] font-bold rounded-full px-2.5 py-1 ${
              p === 2 ? 'bg-accent text-white' : 'bg-white/10 text-ink-muted'
            }`}
          >
            Phase {p}
          </span>
        ))}
        <span className="ml-auto text-[10px] font-mono text-ink-muted">12:43</span>
      </div>
      <div className="flex items-start gap-2">
        <span className="w-6 h-6 rounded-full bg-accent/30 border border-accent/50 text-accent-bright text-[9px] font-bold flex items-center justify-center flex-shrink-0">AI</span>
        <div className="bg-raised rounded-xl rounded-tl-sm px-3 py-2 text-xs text-ink-secondary">
          Explain how closures work in JavaScript.
        </div>
      </div>
      <div className="bg-black/40 rounded-lg px-3 py-2 font-mono text-[11px] text-accent-bright">
        {'const counter = () => { let n = 0; … }'}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-end gap-0.5 h-4">
          {[60, 90, 45, 100, 70, 85, 50].map((h, i) => (
            <span
              key={i}
              className="w-0.5 bg-accent-bright rounded-full animate-wave origin-bottom"
              style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </div>
        <span className="text-[10px] text-ink-muted">Speaking…</span>
        <span className="ml-auto flex items-center gap-0.5">
          {[0, 1, 2].map((d) => (
            <span key={d} className="w-1 h-1 rounded-full bg-ink-muted animate-dot-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
          ))}
        </span>
      </div>
    </div>
  );
}

/* ── Hero illustration: candidate at a monitor mid-AI-interview, floating skill
   chips and analytics cards around it. Pure CSS/SVG so it ships with the bundle;
   the whole block is decorative (aria-hidden) and swappable for rendered art later. ── */
function HeroScene({ par }: { par: { x: number; y: number } }) {
  const chips = [
    { label: 'React', dot: '#61dafb', cls: 'top-[1%] left-[3%]', depth: 22, anim: 'animate-bob' },
    { label: 'System Design', dot: '#d84fd8', cls: 'top-[-2%] right-[10%]', depth: 16, anim: 'animate-bob [animation-delay:0.7s] [animation-duration:8s]' },
    { label: 'TypeScript', dot: '#3178c6', cls: 'top-[26%] left-[-5%]', depth: 30, anim: 'animate-bob [animation-delay:1.3s]' },
    { label: 'Python', dot: '#ffd343', cls: 'top-[14%] right-[-4%]', depth: 26, anim: 'animate-bob [animation-delay:2s] [animation-duration:9s]' },
    { label: 'SQL', dot: '#8be99e', cls: 'top-[52%] left-[-7%]', depth: 18, anim: 'animate-bob [animation-delay:0.4s] [animation-duration:7.5s]' },
    { label: 'Sales Pitch', dot: '#f47b67', cls: 'top-[58%] right-[-6%]', depth: 24, anim: 'animate-bob [animation-delay:1.7s]' },
    { label: 'Behavioral', dot: '#9fc3fa', cls: 'bottom-[0%] right-[16%]', depth: 14, anim: 'animate-bob [animation-delay:2.4s] [animation-duration:8.5s]' },
    { label: 'Cloud & DevOps', dot: '#67e8f9', cls: 'top-[10%] left-[30%]', depth: 12, anim: 'animate-bob [animation-delay:1s] [animation-duration:10s]' },
  ];
  const scoreRows: [string, string, string][] = [
    ['Communication', '84%', '#8be99e'],
    ['Technical', '76%', '#7983f5'],
    ['Confidence', '68%', '#d984dd'],
  ];
  return (
    <div className="relative w-full max-w-[560px] mx-auto aspect-[10/9] pointer-events-none select-none" aria-hidden="true">
      {/* Nebula glow behind the scene */}
      <div className="absolute inset-0 bg-[radial-gradient(45%_40%_at_55%_32%,rgba(88,101,242,0.4),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(35%_30%_at_22%_75%,rgba(216,79,216,0.2),transparent_70%)]" />

      {/* ── Monitor running the AI interview ── */}
      <Floaty className="left-[8%] right-[10%] top-[5%] h-[55%]" depth={6} par={par} anim="">
        <div className="w-full h-full rounded-2xl bg-[#0b0c1f]/95 border border-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.55),0_0_60px_rgba(88,101,242,0.3)] p-3.5 flex flex-col gap-2.5 overflow-hidden">
          {/* Window bar */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-danger/70" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
            <span className="ml-2 text-[9px] font-semibold text-ink-muted truncate">AI Interview — Phase 2 of 3</span>
            <span className="ml-auto flex items-center gap-1 text-[8px] font-bold text-danger-bright">
              <span className="w-1 h-1 rounded-full bg-danger-bright animate-pulse-slow" /> REC
            </span>
          </div>
          {/* Main: AI tile + question/transcript */}
          <div className="flex-1 flex gap-2.5 min-h-0">
            <div className="w-[42%] rounded-xl bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center gap-1.5">
              <div className="relative flex items-center justify-center">
                <span className="absolute -inset-1.5 rounded-full speaking-ring" />
                <div className="w-11 h-11 rounded-full bg-accent/25 border-2 border-accent flex items-center justify-center font-display text-xs text-accent-bright">AI</div>
              </div>
              <div className="flex items-end gap-[2px] h-3.5">
                {[55, 90, 40, 100, 65, 80, 50].map((h, i) => (
                  <span key={i} className="w-[3px] bg-accent-bright rounded-full animate-wave origin-bottom" style={{ height: `${h}%`, animationDelay: `${i * 0.07}s` }} />
                ))}
              </div>
              <span className="text-[8px] text-ink-muted">Speaking…</span>
            </div>
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              <div className="bg-raised/80 rounded-lg p-2">
                <p className="text-[8px] text-accent-bright font-bold uppercase tracking-widest mb-1.5">Question 4</p>
                <div className="space-y-1">
                  <div className="h-1.5 rounded-full bg-white/20 w-full" />
                  <div className="h-1.5 rounded-full bg-white/20 w-4/5" />
                  <div className="h-1.5 rounded-full bg-white/12 w-3/5" />
                </div>
              </div>
              <div className="self-end max-w-[85%] bg-accent/20 border border-accent/35 rounded-lg rounded-tr-sm p-1.5 w-full">
                <div className="space-y-1">
                  <div className="h-1 rounded-full bg-white/25 w-full" />
                  <div className="h-1 rounded-full bg-white/25 w-2/3" />
                </div>
              </div>
              <div className="flex items-center gap-1 bg-white/[0.05] rounded-lg px-2 py-1.5 w-max">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="w-1 h-1 rounded-full bg-ink-muted animate-dot-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
          {/* Round tracker + progress */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[8px] font-bold rounded-full px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">✓ 1</span>
            <span className="text-[8px] font-bold rounded-full px-2 py-0.5 bg-accent text-white">2</span>
            <span className="text-[8px] font-bold rounded-full px-2 py-0.5 bg-white/10 text-ink-muted">3</span>
            <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-[55%] rounded-full bg-gradient-to-r from-accent to-[#d84fd8]" />
            </div>
            <span className="text-[8px] font-mono text-ink-muted">12:43</span>
          </div>
        </div>
      </Floaty>

      {/* Monitor stand + desk */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[60%] w-14 h-7 bg-[#171833] [clip-path:polygon(18%_0,82%_0,100%_100%,0_100%)]" />
      <div className="absolute top-[66%] inset-x-[12%] h-2.5 rounded-full bg-[#1d1f42] shadow-[0_10px_30px_rgba(0,0,0,0.45)]" />

      {/* Candidate silhouette (from behind, headphones on) */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[55%] flex flex-col items-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-[#13142e] shadow-[0_-4px_20px_rgba(88,101,242,0.3)]" />
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-[4.4rem] h-9 border-t-4 border-accent/80 rounded-t-full" />
          <div className="absolute top-6 -left-1.5 w-3 h-6 rounded-md bg-accent/90" />
          <div className="absolute top-6 -right-1.5 w-3 h-6 rounded-md bg-accent/90" />
        </div>
        <div className="w-44 h-16 -mt-2.5 rounded-t-[3rem] bg-[#10112a] border-t-2 border-accent/25" />
      </div>

      {/* ── Floating skill chips ── */}
      {chips.map((c) => (
        <Floaty key={c.label} className={c.cls} depth={c.depth} par={par} anim={c.anim}>
          <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur border border-white/20 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-ink shadow-lg whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.dot }} />
            {c.label}
          </span>
        </Floaty>
      ))}

      {/* ── AI score card ── */}
      <Floaty className="top-[32%] right-[-7%] w-40" depth={20} par={par} anim="animate-bob [animation-delay:0.9s] [animation-duration:9s]">
        <div className="bg-stage/90 backdrop-blur border border-white/15 rounded-2xl p-3 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase">AI Score</span>
            <span className="font-display text-emerald-400 text-sm">8.4</span>
          </div>
          <div className="space-y-1.5">
            {scoreRows.map(([label, w, color]) => (
              <div key={label}>
                <p className="text-[8px] text-ink-secondary mb-0.5">{label}</p>
                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: w, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Floaty>

      {/* ── Growth graph card ── */}
      <Floaty className="bottom-[2%] left-[-4%] w-36" depth={26} par={par} anim="animate-bob [animation-delay:1.6s] [animation-duration:8s]">
        <div className="bg-stage/90 backdrop-blur border border-white/15 rounded-2xl p-3 shadow-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-bold tracking-widest text-ink-muted uppercase">Progress</span>
            <span className="text-emerald-400 text-[10px] font-bold">↑ +23%</span>
          </div>
          <svg viewBox="0 0 100 36" className="w-full h-9">
            <polyline points="0,30 18,26 36,28 54,18 72,14 100,5" fill="none" stroke="#7983f5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="100" cy="5" r="3" fill="#8be99e" />
          </svg>
        </div>
      </Floaty>

      {/* Glowing particles */}
      <span className="absolute top-[8%] left-[22%] w-1 h-1 rounded-full bg-white/80 animate-twinkle" />
      <span className="absolute top-[44%] right-[8%] w-1.5 h-1.5 rounded-full bg-accent-bright/80 blur-[1px] animate-twinkle [animation-delay:0.8s]" />
      <span className="absolute bottom-[18%] right-[30%] w-1 h-1 rounded-full bg-[#ffb3f1]/80 animate-twinkle [animation-delay:1.5s]" />
      <span className="absolute bottom-[8%] left-[34%] text-white/70 text-xs animate-twinkle [animation-delay:2.1s]">✦</span>
      <span className="absolute top-[2%] right-[34%] text-[#ffb3f1]/80 text-[10px] animate-twinkle [animation-delay:1.1s]">✦</span>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [modeInfo, setModeInfo] = useState<ModeInfo | null>(null);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState('');
  // Normalized cursor position (-1..1) driving the decorative parallax layer
  const [par, setPar] = useState({ x: 0, y: 0 });

  useEffect(() => {
    axios.get<ModeInfo>('/api/mode')
      .then(({ data }) => setModeInfo(data))
      .catch(() => setModeInfo({ mode: 'local', model: 'Local — Qwen2.5 7B (Ollama)', requiresKey: false, claudeKeyAvailable: false, localAvailable: false }));
  }, []);

  const handleModeChange = async (newMode: Mode) => {
    if (!modeInfo || modeInfo.mode === newMode || switching) return;
    setSwitching(true);
    setSwitchError('');
    try {
      const { data } = await axios.post<ModeInfo>('/api/mode', { mode: newMode });
      setModeInfo(data);
    } catch (err: any) {
      setSwitchError(err.response?.data?.error || 'Failed to switch mode.');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div
      className="min-h-screen text-ink flex flex-col relative bg-[linear-gradient(180deg,#404eed_0%,#2b32c8_22%,#15173e_52%,#0e1030_100%)]"
      onMouseMove={(e) => setPar({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      })}
    >

      {/* Ambient backdrop: starfield + drifting aurora */}
      <div className="starfield" aria-hidden="true" />
      <div className="aurora-field" aria-hidden="true">
        <div className="aurora-blob aurora-blob-a" />
        <div className="aurora-blob aurora-blob-b" />
        <div className="aurora-blob aurora-blob-c" />
      </div>

      {/* Discord-style hero lighting: dark vignette on the copy side (left),
          bright blurple bloom behind the illustration (right). Scrolls away with the hero. */}
      <div
        className="absolute inset-x-0 top-0 h-[110vh] pointer-events-none z-0 bg-[radial-gradient(52%_46%_at_76%_26%,rgba(99,112,255,0.5),transparent_72%),linear-gradient(90deg,rgba(8,9,22,0.55)_0%,rgba(8,9,22,0.3)_32%,transparent_62%)]"
        aria-hidden="true"
      />

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 px-6 py-4 bg-stage/30 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex w-2.5 h-2.5">
              <span className="absolute inline-flex w-full h-full rounded-full bg-white/60 animate-ping" style={{ animationDuration: '3s' }} />
              <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-white" />
            </span>
            <span className="font-display text-sm tracking-tight">MockInterview</span>
          </div>

          {/* Live mode pill */}
          {modeInfo && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium animate-fade-in ${
              modeInfo.mode === 'claude'
                ? 'bg-white/10 border-white/25 text-ink'
                : 'bg-sky-500/15 border-sky-400/40 text-sky-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                modeInfo.mode === 'claude' ? 'bg-white' : 'bg-sky-300'
              } animate-pulse-slow block`} />
              {modeInfo.mode === 'claude' ? '✦ Claude (Premium)' : '◆ Local Model'}
            </div>
          )}
        </div>
      </header>

      {/* ── Hero — Discord-style split: copy left, illustrated scene right ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 md:pt-20 pb-14 w-full">
        <div className="grid md:grid-cols-2 gap-10 md:gap-6 items-center">
          <div className="text-center md:text-left relative">
            {/* Sparkles framing the copy */}
            <span className="absolute -top-8 left-[8%] text-white/80 animate-twinkle hidden md:block" aria-hidden="true">✦</span>
            <span className="absolute top-1/2 -left-8 text-[#ffb3f1]/80 text-xs animate-twinkle [animation-delay:1.3s] hidden lg:block" aria-hidden="true">✦</span>

            <h1 className="font-display uppercase text-4xl md:text-5xl xl:text-6xl leading-[1.05] mb-6 animate-fade-up">
              Rehearse the interview before it counts
            </h1>
            <p className="text-white/85 text-lg leading-relaxed max-w-xl mx-auto md:mx-0 animate-fade-up anim-delay-1">
              A realistic AI interviewer that adapts to your CV and the job description.
              Three timed rounds, live voice, real code — and a scored report at the end.
            </p>
            <div className="flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-3 mt-8 animate-fade-up anim-delay-2">
              <button
                onClick={() => navigate('/intake')}
                className="group flex items-center justify-center bg-white hover:text-accent text-stage font-semibold py-3.5 px-8 rounded-full transition-all duration-200 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] active:scale-[0.97]"
              >
                Start practicing now <ArrowRight />
              </button>
              <a
                href="#how-it-works"
                className="flex items-center justify-center bg-stage/60 hover:bg-stage/80 text-ink font-semibold py-3.5 px-8 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Illustrated product scene (decorative; swap for rendered art if commissioned) */}
          <div className="hidden md:block animate-fade-up anim-delay-2">
            <HeroScene par={par} />
          </div>
        </div>
      </section>

      {/* ── Topic marquee — what the interviewer can cover ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-16 w-full animate-fade-up anim-delay-3">
        <div className="overflow-hidden marquee-mask">
          <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
            {[...MARQUEE_TOPICS, ...MARQUEE_TOPICS].map((t, i) => (
              <span
                key={i}
                className="mr-3 px-3.5 py-1.5 rounded-full border border-white/15 bg-white/[0.06] text-ink text-xs font-medium whitespace-nowrap"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Interview tracks ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-16 w-full">
        {/* Primary track — the only actionable one, so it leads */}
        <div
          onClick={() => navigate('/intake')}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            e.currentTarget.style.setProperty('--sx', `${e.clientX - r.left}px`);
            e.currentTarget.style.setProperty('--sy', `${e.clientY - r.top}px`);
          }}
          className="group spotlight relative bg-white/[0.05] backdrop-blur-sm border border-white/10 hover:border-accent-bright/60 rounded-[2rem] p-8 md:p-10 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_56px_rgba(88,101,242,0.3)]"
        >
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-accent-bright/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-accent-bright transition-transform duration-300 group-hover:scale-110"><CodeIcon /></span>
                <h2 className="font-display uppercase text-xl md:text-2xl tracking-tight">Coding / Technical</h2>
              </div>
              <p className="text-ink-secondary text-sm leading-relaxed max-w-lg mb-5">
                Full-stack, backend, frontend, algorithms — a comprehensive 3-phase technical interview
                tailored to your CV and job description.
              </p>
              <ul className="flex flex-wrap gap-x-5 gap-y-2">
                {['CV & JD-aware questions', 'Adaptive follow-ups', 'Live voice interviewer', 'Scored performance report'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink-secondary">
                    <span className="w-1 h-1 rounded-full bg-accent-bright flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-shrink-0">
              <button className="group flex items-center justify-center bg-accent hover:bg-accent-bright active:bg-accent-deep active:scale-[0.97] text-accent-ink font-semibold py-3.5 px-7 rounded-full transition-all duration-200 glow-accent hover:glow-accent-lg hover:-translate-y-0.5">
                Start Interview <ArrowRight />
              </button>
            </div>
          </div>
        </div>

        {/* Upcoming tracks — quiet rows, not competing cards */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: <SalesIcon />, title: 'Sales', desc: 'Pitch, objection handling, and closing scenarios.' },
            { icon: <MarketingIcon />, title: 'Marketing', desc: 'Strategy, campaigns, analytics, and brand.' },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="flex items-center gap-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]"
            >
              <span className="text-ink-muted flex-shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-ink-secondary">{title}</h2>
                <p className="text-xs text-ink-muted truncate">{desc}</p>
              </div>
              <span className="text-xs bg-white/[0.08] text-ink-muted px-2.5 py-1 rounded-full font-medium flex-shrink-0">Coming soon</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works — three scroll-revealed step panels ── */}
      <section id="how-it-works" className="relative z-10 max-w-5xl mx-auto px-6 pb-16 w-full scroll-mt-20">
        <div className="text-center mb-10">
          <h2 className="font-display uppercase text-3xl md:text-5xl leading-tight mb-3">How it works</h2>
          <p className="text-ink-secondary max-w-md mx-auto">Three steps between you and a scored, realistic rehearsal.</p>
        </div>
        <div className="space-y-8">
          <StepSection
            step={1}
            title="Share the role & your CV"
            desc="Paste the job description (or just a link), pick your experience level, and upload your CV. The interviewer reads everything before you walk in."
            points={[
              'PDF or DOCX CV — parsed automatically',
              'JD via paste, URL, or skip it and let the AI infer',
              'Questions calibrated to your experience level',
            ]}
            art={<Step1Art />}
            artGradient="bg-gradient-to-br from-[#5865f2] via-[#8b5cf6] to-[#d84fd8]"
          />
          <StepSection
            step={2}
            title="Check your camera & mic"
            desc="A quick device check, exactly like joining a real call. Voice is the default, but a typed fallback is always one tap away."
            points={[
              'Camera & microphone preview before you join',
              'Live voice interviewer with speech recognition',
              'Screen share appears when Phase 3 needs it',
            ]}
            art={<Step2Art />}
            artGradient="bg-gradient-to-br from-[#5865f2] via-[#3b9d6f] to-[#23a55a]"
            flip
          />
          <StepSection
            step={3}
            title="Run the 3-phase interview"
            desc="Intro and career questions, JS theory with live coding, then an open practical challenge — timed, adaptive, and scored as you go."
            points={[
              'Adaptive follow-ups based on your answers',
              'Real in-browser code editor for the coding rounds',
              'A scored report with strengths and gaps at the end',
            ]}
            art={<Step3Art />}
            artGradient="bg-gradient-to-br from-[#0f101b] via-[#7c5ce0] to-[#f47b67]"
          />
        </div>
      </section>

      {/* ── AI Mode Selector ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20 w-full flex-1">
        <div className="bg-white/[0.05] backdrop-blur-sm border border-white/10 rounded-[2rem] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">AI Engine</h3>
              <p className="text-xs text-ink-muted mt-0.5">Choose which AI powers your interview</p>
            </div>
            {switching && (
              <div className="flex items-center gap-2 text-ink-secondary text-xs">
                <div className="w-3.5 h-3.5 border-2 border-ink-muted/40 border-t-ink-secondary rounded-full animate-spin" />
                Switching…
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* ── Premium (Claude) radio ── */}
            <label
              className={`relative flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-200 select-none ${
                modeInfo?.claudeKeyAvailable
                  ? 'cursor-pointer hover:-translate-y-0.5'
                  : 'cursor-not-allowed opacity-50'
              } ${
                modeInfo?.mode === 'claude'
                  ? 'border-accent-bright/60 bg-accent/[0.12] shadow-[0_4px_24px_rgba(88,101,242,0.2)]'
                  : 'border-white/[0.1] bg-white/[0.03] hover:border-white/25'
              } ${switching ? 'pointer-events-none opacity-60' : ''}`}
            >
              <input
                type="radio"
                name="ai-mode"
                value="claude"
                checked={modeInfo?.mode === 'claude'}
                onChange={() => handleModeChange('claude')}
                disabled={!modeInfo?.claudeKeyAvailable}
                className="sr-only"
              />

              <div className="flex items-center justify-between">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  modeInfo?.mode === 'claude' ? 'border-accent-bright' : 'border-ink-muted/50'
                }`}>
                  {modeInfo?.mode === 'claude' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-accent-bright animate-pop-in" />
                  )}
                </div>
                {modeInfo?.claudeKeyAvailable ? (
                  <span className="text-xs bg-accent/20 border border-accent-bright/40 text-accent-bright px-2 py-0.5 rounded-full font-medium">
                    Premium
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs bg-white/[0.06] border border-white/[0.1] text-ink-muted px-2 py-0.5 rounded-full">
                    <LockIcon /> Key required
                  </span>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold mb-0.5">Premium — Claude</p>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  {modeInfo?.claudeKeyAvailable
                    ? 'Claude Sonnet by Anthropic — best question quality'
                    : 'Add ANTHROPIC_API_KEY to server/.env to unlock'}
                </p>
              </div>

              <ul className="space-y-1">
                {['Best interview quality', 'Claude Sonnet model', 'API key in server/.env'].map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-ink-secondary">
                    <span className="w-1 h-1 rounded-full bg-accent-bright/70 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </label>

            {/* ── Local model radio ── */}
            <label
              className={`relative flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-200 select-none ${
                modeInfo?.localAvailable
                  ? 'cursor-pointer hover:-translate-y-0.5'
                  : 'cursor-not-allowed opacity-50'
              } ${
                modeInfo?.mode === 'local'
                  ? 'border-sky-400/60 bg-sky-500/[0.1] shadow-[0_4px_24px_rgba(56,189,248,0.2)]'
                  : 'border-white/[0.1] bg-white/[0.03] hover:border-white/25'
              } ${switching ? 'pointer-events-none opacity-60' : ''}`}
            >
              <input
                type="radio"
                name="ai-mode"
                value="local"
                checked={modeInfo?.mode === 'local'}
                onChange={() => handleModeChange('local')}
                disabled={!modeInfo?.localAvailable}
                className="sr-only"
              />

              <div className="flex items-center justify-between">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  modeInfo?.mode === 'local' ? 'border-sky-400' : 'border-ink-muted/50'
                }`}>
                  {modeInfo?.mode === 'local' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pop-in" />
                  )}
                </div>
                {modeInfo?.localAvailable ? (
                  <span className="text-xs bg-sky-500/15 border border-sky-400/40 text-sky-200 px-2 py-0.5 rounded-full font-medium">
                    Local
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs bg-white/[0.06] border border-white/[0.1] text-ink-muted px-2 py-0.5 rounded-full">
                    <LockIcon /> Setup required
                  </span>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold mb-0.5">Local Model</p>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  {modeInfo?.localAvailable
                    ? 'Runs a local model via Ollama — private & offline'
                    : 'Install Ollama, then set LOCAL_AI_BASE_URL in server/.env'}
                </p>
              </div>

              <ul className="space-y-1">
                {['Private & offline', 'Bring your own model', 'No API key needed'].map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-ink-secondary">
                    <span className="w-1 h-1 rounded-full bg-sky-300/70 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </label>
          </div>

          {/* Switch error */}
          {switchError && (
            <div className="mt-3 flex items-start gap-2 bg-danger/15 border border-danger/35 rounded-xl px-4 py-3 animate-slide-in">
              <span className="text-danger-bright text-base flex-shrink-0">⚠</span>
              <p className="text-danger-bright text-xs leading-relaxed">{switchError}</p>
            </div>
          )}

          {/* Active model display */}
          {modeInfo && !switchError && (
            <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted px-1">
              <span className={`w-1.5 h-1.5 rounded-full ${modeInfo.mode === 'claude' ? 'bg-accent-bright' : 'bg-sky-300'} animate-pulse-slow block`} />
              Active: <span className="text-ink-secondary font-medium">{modeInfo.model}</span>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer — Discord-style closing statement + link columns ── */}
      <footer className="relative z-10 border-t border-white/10 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-10 relative">
          {/* Closing sparkles */}
          <div className="hidden md:block" aria-hidden="true">
            <Floaty className="top-10 left-6 text-white/80" depth={16} par={par} anim="animate-twinkle">✦</Floaty>
            <Floaty className="top-24 right-10 text-[#ffb3f1] text-sm" depth={24} par={par} anim="animate-twinkle [animation-delay:0.9s]">✦</Floaty>
            <Floaty className="top-6 right-1/3 text-white/40 text-xs" depth={10} par={par} anim="animate-twinkle [animation-delay:1.6s]">✦</Floaty>
          </div>

          <div className="text-center mb-14">
            <h2 className="font-display uppercase text-3xl md:text-5xl leading-tight mb-3">
              Ready for the real thing?
            </h2>
            <p className="text-ink-secondary mb-7">
              AI-powered mock interview platform — practice makes permanent.
            </p>
            <button
              onClick={() => navigate('/intake')}
              className="bg-white hover:text-accent text-stage font-semibold py-3.5 px-8 rounded-full transition-all duration-200 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:scale-[0.97]"
            >
              Start practicing →
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/10 pt-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-bright block" />
                <span className="font-display text-sm">MockInterview</span>
              </div>
              <p className="text-ink-muted text-xs leading-relaxed">A rehearsal studio for your next technical interview.</p>
            </div>
            {[
              { head: 'Tracks', links: ['Technical interview', 'Sales (soon)', 'Marketing (soon)'] },
              { head: 'Product', links: ['How it works', 'Choose your AI', 'Performance report'] },
              { head: 'Resources', links: ['Device check', 'Voice & typing', 'Privacy'] },
            ].map(({ head, links }) => (
              <div key={head}>
                <h3 className="text-accent-bright text-sm font-semibold mb-3">{head}</h3>
                <ul className="space-y-2">
                  {links.map((l) => (
                    <li key={l}>
                      <a href="#how-it-works" className="text-ink-secondary hover:text-ink text-sm transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
