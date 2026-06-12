import { Sandpack } from '@codesandbox/sandpack-react';
import { sandpackDark } from '@codesandbox/sandpack-themes';
import { JSExercise } from '../types';

interface Props {
  exercises: JSExercise[];
  activeIndex: number;           // which task the AI is currently on (0-based)
  onClose: () => void;
}

export function JSCodeGround({ exercises, activeIndex, onClose }: Props) {
  const current = exercises[activeIndex] ?? exercises[0];
  if (!current) return null;

  // Clamp so we never go out of bounds
  const safeIndex = Math.min(activeIndex, exercises.length - 1);

  return (
    <div className="fixed inset-0 z-50 bg-stage flex flex-col">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] bg-surface flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-accent-bright font-semibold text-sm">JavaScript Coding Environment</span>
          <span className="text-ink-muted text-xs hidden sm:block">Phase 2 — JS Coding Round</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-muted">
            Task {safeIndex + 1} of {exercises.length}
          </span>
          <button
            onClick={onClose}
            className="text-xs text-ink-secondary hover:text-ink border border-white/[0.1] hover:border-white/25 px-3 py-1.5 rounded-lg transition-colors"
          >
            Back to Interview
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: task list + current description */}
        <div className="w-72 flex-shrink-0 flex flex-col border-r border-white/[0.07] bg-surface/50 overflow-hidden">
          {/* Task list */}
          <div className="p-4 border-b border-white/[0.07] flex-shrink-0">
            <p className="text-accent text-xs font-medium uppercase tracking-wider mb-3">
              Tasks
            </p>
            <div className="space-y-1.5">
              {exercises.map((ex, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    i === safeIndex
                      ? 'bg-accent/15 border border-accent/30 text-accent-bright'
                      : i < safeIndex
                      ? 'text-ink-muted line-through'
                      : 'text-ink-secondary'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold border ${
                      i === safeIndex
                        ? 'bg-accent/20 border-accent/50 text-accent-bright'
                        : i < safeIndex
                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                        : 'bg-raised border-white/[0.1] text-ink-muted'
                    }`}
                  >
                    {i < safeIndex ? '✓' : i + 1}
                  </span>
                  <span className="truncate">{ex.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Current task description */}
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-accent text-xs font-medium uppercase tracking-wider mb-2">
              Current Task
            </p>
            <p className="text-ink text-sm font-semibold mb-3">{current.title}</p>
            <p className="text-ink-secondary text-xs leading-relaxed whitespace-pre-wrap">
              {current.description}
            </p>
            <div className="mt-5 pt-4 border-t border-white/[0.07]">
              <p className="text-ink-muted text-xs leading-relaxed">
                Write your solution in the editor. Use <code className="text-accent-bright/90">console.log()</code> to test output.
                When done, go back to the interview and explain your approach.
              </p>
              <a
                href="https://github.com/dinanathsj29/javascript-exercise-beginners"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-[10px] text-ink-muted/70 hover:text-ink-secondary transition-colors"
              >
                Exercise source ↗
              </a>
            </div>
          </div>
        </div>

        {/* Right: Sandpack vanilla JS editor */}
        <div className="flex-1" style={{ minHeight: 0 }}>
          <Sandpack
            key={safeIndex} // remount editor when task changes to reset code
            theme={sandpackDark}
            template="vanilla"
            customSetup={{ entry: '/index.js' }}
            files={{
              '/index.js': {
                code: current.starterCode,
                active: true,
              },
            }}
            options={{
              showNavigator: false,
              showTabs: false,
              showLineNumbers: true,
              showInlineErrors: true,
              autorun: true,
              showConsole: true,
              showConsoleButton: true,
              editorHeight: 'calc(100vh - 52px)',
              resizablePanels: true,
              visibleFiles: ['/index.js'],
              activeFile: '/index.js',
            }}
          />
        </div>
      </div>
    </div>
  );
}
