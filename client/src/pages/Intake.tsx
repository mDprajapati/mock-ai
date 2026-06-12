import { useState, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSession } from '../context/SessionContext';
import { Experience } from '../types';

type Step = 1 | 2 | 3;

const EXPERIENCE_OPTIONS: { value: Experience; label: string; sublabel: string }[] = [
  { value: '0-2', label: '0 – 2 years', sublabel: 'Junior / Entry level' },
  { value: '2-5', label: '2 – 5 years', sublabel: 'Mid level' },
  { value: '5-8', label: '5 – 8 years', sublabel: 'Senior level' },
  { value: '8+', label: '8+ years', sublabel: 'Staff / Principal' },
];

/* ── Decorative side-rail art, one per step (desktop only, aria-hidden) ── */

function ArtPanel({ gradient, children }: { gradient: string; children: ReactNode }) {
  return (
    <div className={`rounded-3xl p-6 shadow-2xl animate-fade-up ${gradient}`}>
      {children}
    </div>
  );
}

function JdArt() {
  return (
    <div className="relative">
      <div className="bg-stage/85 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center gap-1.5 mb-4">
          <span className="w-2 h-2 rounded-full bg-danger/70" />
          <span className="w-2 h-2 rounded-full bg-amber-400/70" />
          <span className="w-2 h-2 rounded-full bg-emerald-400/70" />
          <span className="ml-2 flex-1 bg-white/10 rounded-md px-2 py-1 text-[10px] text-ink-muted truncate">
            company.com/careers/frontend-engineer
          </span>
        </div>
        <div className="space-y-2.5">
          <div className="h-2 rounded-full bg-accent-bright/60 w-2/3" />
          <div className="h-2 rounded-full bg-white/15 w-full" />
          <div className="h-2 rounded-full bg-white/15 w-5/6" />
          <div className="h-2 rounded-full bg-white/15 w-3/4" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {['React', 'TypeScript', 'Remote'].map((t) => (
            <span key={t} className="bg-accent/20 border border-accent/40 text-accent-bright text-[10px] rounded-full px-2 py-0.5">
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="absolute -bottom-3 -right-3 bg-white text-stage text-xs font-bold rounded-full px-3 py-1.5 shadow-xl animate-bob">
        ⌗ Paste or fetch
      </div>
    </div>
  );
}

function LevelArt({ active }: { active: Experience }) {
  const levels: { v: Experience; label: string; h: string }[] = [
    { v: '0-2', label: 'Jr', h: '35%' },
    { v: '2-5', label: 'Mid', h: '58%' },
    { v: '5-8', label: 'Sr', h: '78%' },
    { v: '8+', label: 'Staff', h: '100%' },
  ];
  return (
    <div className="bg-stage/85 rounded-2xl p-5 shadow-2xl">
      <p className="text-ink-muted text-[10px] font-bold tracking-widest uppercase mb-4">Difficulty calibration</p>
      <div className="flex items-end gap-3 h-32">
        {levels.map((l) => (
          <div key={l.v} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <div
              className={`w-full rounded-lg transition-all duration-500 ${
                active === l.v ? 'bg-accent shadow-[0_0_20px_rgba(88,101,242,0.6)]' : 'bg-white/10'
              }`}
              style={{ height: l.h }}
            />
            <span className={`text-[10px] font-semibold transition-colors ${active === l.v ? 'text-accent-bright' : 'text-ink-muted'}`}>
              {l.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CvArt({ done }: { done: boolean }) {
  return (
    <div className="relative">
      <div className="bg-stage/85 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="bg-danger/90 text-white text-[10px] font-bold rounded px-1.5 py-0.5">PDF</span>
          {/* Static label — the real filename renders in the form; duplicating it here breaks text queries */}
          <span className="text-ink text-xs font-medium truncate">your_cv.pdf</span>
          {done && <span className="ml-auto text-emerald-400 text-sm animate-pop-in">✓</span>}
        </div>
        <div className="space-y-2.5">
          <div className="h-2 rounded-full bg-white/20 w-3/4" />
          <div className="h-2 rounded-full bg-white/12 w-full" />
          <div className="h-2 rounded-full bg-accent-bright/60 w-1/2" />
          <div className="h-2 rounded-full bg-white/12 w-5/6" />
        </div>
      </div>
      <div className="absolute -top-3 -right-3 bg-white text-stage text-xs font-bold rounded-full px-3 py-1.5 shadow-xl animate-bob">
        ⬆ Upload CV
      </div>
    </div>
  );
}

export default function Intake() {
  const navigate = useNavigate();
  const { setSession } = useSession();

  const [step, setStep] = useState<Step>(1);
  const [jdMode, setJdMode] = useState<'paste' | 'url'>('paste');
  const [jdText, setJdText] = useState('');
  const [jdUrl, setJdUrl] = useState('');
  const [jdFetching, setJdFetching] = useState(false);
  const [jdError, setJdError] = useState('');

  const [experience, setExperience] = useState<Experience>('2-5');

  const [jdSkipped, setJdSkipped] = useState(false);

  const [cvText, setCvText] = useState('');
  const [cvFileName, setCvFileName] = useState('');
  const [cvUploading, setCvUploading] = useState(false);
  const [cvError, setCvError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchJd = async () => {
    if (!jdUrl.trim()) return;
    setJdFetching(true);
    setJdError('');
    try {
      const { data } = await axios.post('/api/fetch-jd', { url: jdUrl.trim() });
      setJdText(data.text);
    } catch (err: any) {
      setJdError(err.response?.data?.error || 'Failed to fetch job description. Paste the text directly.');
    } finally {
      setJdFetching(false);
    }
  };

  const handleCvUpload = async (file: File) => {
    if (!file) return;
    setCvUploading(true);
    setCvError('');
    const form = new FormData();
    form.append('cv', file);
    try {
      const { data } = await axios.post('/api/parse-cv', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCvText(data.text);
      setCvFileName(data.fileName);
    } catch (err: any) {
      setCvError(err.response?.data?.error || 'Failed to parse CV. Please try a different file.');
    } finally {
      setCvUploading(false);
    }
  };

  const canAdvanceStep1 = jdText.trim().length > 50;
  const canAdvanceStep2 = !!experience;
  const canAdvanceStep3 = cvText.length > 50;

  const handleSkipJd = () => {
    setJdSkipped(true);
    setJdText('');
    setStep(2);
  };

  const handleContinue = () => {
    if (step < 3) {
      setStep((s) => (s + 1) as Step);
    } else {
      setSession({ jdText, experience, cvText, cvFileName, jdSkipped });
      navigate('/device-check');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col relative">
      {/* Ambient backdrop: dim starfield + fixed blurple glow (no motion on task screens) */}
      <div className="starfield opacity-70" aria-hidden="true" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(55%_45%_at_50%_0%,rgba(88,101,242,0.16),transparent_70%)]" aria-hidden="true" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] px-6 py-4 bg-stage/30 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 text-ink-secondary hover:text-ink transition-colors">
            <span className="w-2.5 h-2.5 rounded-full bg-accent block" />
            <span className="font-display text-sm">MockInterview</span>
          </button>
          <span className="text-ink-muted text-sm">Coding / Technical</span>
        </div>
      </header>

      <div className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-10 animate-fade-up">
          {([1, 2, 3] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div className={`flex items-center gap-2 transition-colors duration-300 ${s <= step ? 'text-ink' : 'text-ink-muted'}`}>
                <div className="relative flex-shrink-0">
                  {s === step && (
                    <span className="absolute inset-0 rounded-full bg-accent/30 animate-ping" style={{ animationDuration: '2.5s' }} aria-hidden="true" />
                  )}
                  <div className={`relative w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border transition-all duration-300 ${
                    s < step ? 'bg-accent border-accent text-accent-ink' :
                    s === step ? 'border-accent-bright text-accent-bright bg-accent/15 shadow-[0_0_16px_rgba(88,101,242,0.45)]' :
                    'border-white/[0.1] text-ink-muted'
                  }`}>
                    {s < step ? <span className="animate-pop-in">✓</span> : s}
                  </div>
                </div>
                <span className="text-sm hidden sm:block">
                  {s === 1 ? 'Job Description' : s === 2 ? 'Experience' : 'Upload CV'}
                </span>
              </div>
              {i < 2 && (
                <div className="flex-1 h-px bg-white/[0.08] relative overflow-hidden rounded-full">
                  <div
                    className="absolute inset-y-0 left-0 bg-accent transition-all duration-500 ease-out"
                    style={{ width: s < step ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
          {/* Form column — glassy panel, same vocabulary as the Landing step panels */}
          <div className="flex-1 min-w-0 bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-[2rem] p-6 md:p-8">

        {/* Step 1 — Job Description */}
        {step === 1 && (
          <div className="animate-fade-up">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="font-display uppercase text-2xl">Job Description</h2>
              <span className="text-xs text-ink-muted border border-white/[0.1] rounded px-2 py-0.5">Optional</span>
            </div>
            <p className="text-ink-secondary text-sm mb-6">
              Paste the JD text or provide a URL to fetch it automatically. You can also skip — the AI will infer the role from your CV.
            </p>

            <div className="flex gap-2 mb-4">
              {(['paste', 'url'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setJdMode(mode)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    jdMode === mode
                      ? 'bg-accent border-accent text-accent-ink'
                      : 'border-white/[0.1] text-ink-secondary hover:border-white/25'
                  }`}
                >
                  {mode === 'paste' ? 'Paste text' : 'From URL'}
                </button>
              ))}
            </div>

            {jdMode === 'paste' ? (
              <textarea
                className="w-full h-56 bg-surface border border-white/[0.08] focus:border-accent/60 rounded-xl p-4 text-sm text-ink placeholder-ink-muted resize-none outline-none transition-colors"
                placeholder="Paste the job description here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              />
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="url"
                    className="flex-1 bg-surface border border-white/[0.08] focus:border-accent/60 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-muted outline-none transition-colors"
                    placeholder="https://company.com/jobs/..."
                    value={jdUrl}
                    onChange={(e) => setJdUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchJd()}
                  />
                  <button
                    onClick={fetchJd}
                    disabled={jdFetching || !jdUrl.trim()}
                    className="px-5 py-3 bg-accent hover:bg-accent-bright active:bg-accent-deep disabled:opacity-50 disabled:cursor-not-allowed text-accent-ink rounded-xl text-sm font-semibold transition-colors"
                  >
                    {jdFetching ? 'Fetching…' : 'Fetch'}
                  </button>
                </div>
                {jdError && <p className="text-danger-bright text-sm">{jdError}</p>}
                {jdText && !jdError && (
                  <div className="bg-surface border border-emerald-500/30 rounded-xl p-4">
                    <p className="text-emerald-400 text-xs font-medium mb-2">Job description extracted successfully</p>
                    <p className="text-ink-secondary text-sm line-clamp-4">{jdText.slice(0, 400)}…</p>
                  </div>
                )}
              </div>
            )}

            {jdMode === 'paste' && jdText && jdText.length < 50 && (
              <p className="text-accent-bright text-xs mt-2">Please paste a more complete job description.</p>
            )}
          </div>
        )}

        {/* Step 2 — Experience */}
        {step === 2 && (
          <div className="animate-fade-up">
            <h2 className="font-display uppercase text-2xl mb-1">Years of Experience</h2>
            <p className="text-ink-secondary text-sm mb-6">The AI will calibrate question difficulty to your level.</p>
            <div className="grid grid-cols-2 gap-3">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setExperience(opt.value)}
                  className={`p-5 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 ${
                    experience === opt.value
                      ? 'border-accent-bright/60 bg-accent/[0.14] text-ink shadow-[0_4px_24px_rgba(88,101,242,0.25)]'
                      : 'border-white/[0.08] bg-surface text-ink-secondary hover:border-white/25'
                  }`}
                >
                  <div className="font-semibold text-base mb-0.5">{opt.label}</div>
                  <div className="text-xs text-ink-muted">{opt.sublabel}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — CV Upload */}
        {step === 3 && (
          <div className="animate-fade-up">
            <h2 className="font-display uppercase text-2xl mb-1">Upload Your CV</h2>
            <p className="text-ink-secondary text-sm mb-6">PDF or DOCX. The AI will use your CV to ask personalized questions.</p>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) handleCvUpload(f);
              }}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
                cvText ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/[0.1] hover:border-accent/40 hover:bg-accent/[0.03] bg-surface/50'
              }`}
            >
              {cvUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                  <p className="text-ink-secondary">Parsing CV…</p>
                </div>
              ) : cvText ? (
                <>
                  <div className="text-emerald-400 text-3xl mb-2 animate-pop-in">✓</div>
                  <p className="text-emerald-400 font-medium">{cvFileName}</p>
                  <p className="text-ink-muted text-xs mt-1">CV parsed successfully — click to replace</p>
                </>
              ) : (
                <>
                  <div className="text-ink-muted mb-3 text-3xl animate-float">📄</div>
                  <p className="text-ink font-medium mb-1">Drag & drop your CV here</p>
                  <p className="text-ink-muted text-sm">or click to browse · PDF or DOCX · max 10 MB</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleCvUpload(f);
              }}
            />
            {cvError && <p className="text-danger-bright text-sm mt-3">{cvError}</p>}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="px-5 py-2.5 border border-white/[0.1] text-ink-secondary hover:border-white/25 hover:text-ink rounded-xl text-sm font-medium transition-colors"
            >
              Back
            </button>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 border border-white/[0.1] text-ink-secondary hover:border-white/25 hover:text-ink rounded-xl text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          )}

          <div className="flex items-center gap-3">
            {step === 1 && (
              <button
                onClick={handleSkipJd}
                className="px-4 py-2.5 text-ink-secondary hover:text-ink text-sm transition-colors underline underline-offset-2"
              >
                Skip — AI decides
              </button>
            )}
            <button
              onClick={handleContinue}
              disabled={
                (step === 1 && !canAdvanceStep1) ||
                (step === 2 && !canAdvanceStep2) ||
                (step === 3 && !canAdvanceStep3)
              }
              className="px-6 py-2.5 bg-accent hover:bg-accent-bright active:bg-accent-deep active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none text-accent-ink font-semibold rounded-xl text-sm transition-all duration-200 glow-accent hover:-translate-y-0.5"
            >
              {step === 3 ? 'Continue to Device Check' : 'Continue'}
            </button>
          </div>
        </div>

          </div>

          {/* Decorative art rail — mirrors the current step, desktop only */}
          <aside className="hidden lg:block w-[320px] flex-shrink-0 sticky top-10" aria-hidden="true">
            {step === 1 && (
              <ArtPanel gradient="bg-gradient-to-br from-[#5865f2] via-[#8b5cf6] to-[#d84fd8]">
                <JdArt />
              </ArtPanel>
            )}
            {step === 2 && (
              <ArtPanel gradient="bg-gradient-to-br from-[#5865f2] via-[#3b9d6f] to-[#23a55a]">
                <LevelArt active={experience} />
              </ArtPanel>
            )}
            {step === 3 && (
              <ArtPanel gradient="bg-gradient-to-br from-[#404eed] via-[#7c5ce0] to-[#f47b67]">
                <CvArt done={!!cvText} />
              </ArtPanel>
            )}
            <span className="absolute -top-4 -right-1 text-white/80 animate-twinkle">✦</span>
            <span className="absolute -bottom-5 left-3 text-[#ffb3f1]/80 text-xs animate-twinkle [animation-delay:1.1s]">✦</span>
          </aside>
        </div>
      </div>
    </div>
  );
}
