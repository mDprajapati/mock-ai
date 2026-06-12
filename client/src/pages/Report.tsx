import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { EvaluationReport, PHASE_NAMES } from '../types';

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const color = score >= 8 ? '#34d399' : score >= 6 ? '#60a5fa' : score >= 4 ? '#fbbf24' : '#e5484d';

  // Start the arc at zero and let the transition draw it after mount
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const dash = drawn ? (score / 10) * circ : 0;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#2c2f6b" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dasharray 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
            filter: `drop-shadow(0 0 6px ${color}55)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-ink">{score}</span>
        <span className="text-xs text-ink-muted">/10</span>
      </div>
    </div>
  );
}

// Per-phase identity tints, echoing the landing step panels (blurple / pink / green)
const PHASE_TINTS = ['#5865f2', '#d84fd8', '#23a55a'];

function PhaseCard({ phase, title, data }: { phase: number; title: string; data: { score: number; feedback: string; strengths: string[]; improvements: string[] } }) {
  const tint = PHASE_TINTS[(phase - 1) % PHASE_TINTS.length];
  return (
    <div
      className="relative overflow-hidden bg-surface border border-white/[0.07] rounded-[1.75rem] p-6 transition-colors duration-300 hover:border-white/[0.16] animate-fade-up"
      style={{ animationDelay: `${phase * 120}ms` }}
    >
      <div
        className="absolute inset-x-0 top-0 h-32 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${tint}26, transparent 70%)` }}
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between mb-5">
        <div>
          <span
            className="inline-block text-xs font-bold tracking-widest uppercase rounded-full px-2.5 py-1 mb-2"
            style={{ background: `${tint}2e`, color: '#fff', border: `1px solid ${tint}66` }}
          >
            Phase {phase}
          </span>
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
        </div>
        <ScoreRing score={data.score} />
      </div>

      <p className="text-ink-secondary text-sm leading-relaxed mb-5 max-w-prose">{data.feedback}</p>

      <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-emerald-400 text-xs font-medium uppercase tracking-wider mb-2">Strengths</p>
          <ul className="space-y-1.5">
            {data.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink-secondary">
                <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-accent-bright text-xs font-medium uppercase tracking-wider mb-2">To Improve</p>
          <ul className="space-y-1.5">
            {data.improvements.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink-secondary">
                <span className="text-accent-bright mt-0.5 flex-shrink-0">→</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function Report() {
  const location = useLocation();
  const navigate = useNavigate();
  const report: EvaluationReport | undefined = location.state?.report;

  if (!report) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-secondary mb-4">No report found. Please complete an interview first.</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-accent hover:bg-accent-bright active:bg-accent-deep text-accent-ink rounded-xl font-semibold transition-colors">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const overallColor = report.overall >= 8 ? 'text-emerald-400' : report.overall >= 6 ? 'text-blue-400' : report.overall >= 4 ? 'text-amber-400' : 'text-danger-bright';

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-6 py-4 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 text-ink-secondary hover:text-ink transition-colors">
            <span className="w-2.5 h-2.5 rounded-full bg-accent block" />
            <span className="font-semibold text-sm">MockInterview</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-white/[0.1] text-ink-secondary hover:border-white/25 hover:text-ink rounded-lg text-sm font-medium transition-colors"
          >
            Print / Save PDF
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Overall score banner — glassy gradient panel, score left / summary right */}
        <div className="relative overflow-hidden bg-white/[0.04] border border-white/10 rounded-[2rem] p-8 md:p-10 mb-8 animate-fade-up">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(120deg, rgba(88,101,242,0.22), transparent 45%, rgba(216,79,216,0.12))' }}
            aria-hidden="true"
          />
          <span className="absolute top-5 right-7 text-white/70 animate-twinkle" aria-hidden="true">✦</span>
          <span className="absolute bottom-6 right-1/4 text-[#ffb3f1]/70 text-xs animate-twinkle [animation-delay:1.1s]" aria-hidden="true">✦</span>
          <div className="relative flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
            <div className="text-center md:text-left flex-shrink-0">
              <div className={`font-display text-7xl md:text-8xl leading-none mb-2 animate-pop-in ${overallColor}`}>{report.overall.toFixed(1)}</div>
              <p className="text-ink-muted text-sm">Overall Score out of 10</p>
            </div>
            <div className="flex-1 min-w-0 text-center md:text-left">
              <p className="font-display uppercase text-xl md:text-2xl leading-tight mb-3">Interview Complete</p>
              <p className="text-ink-secondary leading-relaxed text-sm max-w-xl">{report.summary}</p>
            </div>
          </div>
        </div>

        {/* Phase breakdowns */}
        <div className="grid grid-cols-1 gap-5 mb-8">
          <PhaseCard phase={1} title={PHASE_NAMES[1]} data={report.phase1} />
          <PhaseCard phase={2} title={PHASE_NAMES[2]} data={report.phase2} />
          <PhaseCard phase={3} title={PHASE_NAMES[3]} data={report.phase3} />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center print:hidden">
          <button
            onClick={() => navigate('/intake')}
            className="px-6 py-3 bg-accent hover:bg-accent-bright active:bg-accent-deep active:scale-[0.97] text-accent-ink font-semibold rounded-xl transition-all duration-200 glow-accent hover:-translate-y-0.5"
          >
            Start New Interview
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-white/[0.1] text-ink-secondary hover:border-white/25 hover:text-ink rounded-xl font-medium transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
