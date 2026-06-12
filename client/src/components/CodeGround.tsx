import { Sandpack } from '@codesandbox/sandpack-react';
import { sandpackDark } from '@codesandbox/sandpack-themes';

const STARTER = `import { useState } from "react";

export default function App() {
  // Write your solution here

  return (
    <div style={{ fontFamily: "sans-serif", padding: "24px" }}>
      <h2>Your Solution</h2>
      {/* Start coding below */}
    </div>
  );
}
`;

interface Props {
  challenge: string;
  onClose: () => void;
}

export function CodeGround({ challenge, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-stage flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] bg-surface flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-accent-bright font-semibold text-sm">React Coding Environment</span>
          <span className="text-ink-muted text-xs hidden sm:block">Phase 3 — Practical Round</span>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-ink-secondary hover:text-ink border border-white/[0.1] hover:border-white/25 px-3 py-1.5 rounded-lg transition-colors"
        >
          Back to Interview
        </button>
      </div>

      {/* Body: challenge + editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* Challenge description */}
        <div className="w-72 flex-shrink-0 p-5 border-r border-white/[0.07] overflow-y-auto bg-surface/50">
          <p className="text-accent text-xs font-medium uppercase tracking-wider mb-3">Challenge</p>
          <p className="text-ink text-sm leading-relaxed whitespace-pre-wrap">{challenge}</p>
          <div className="mt-6 pt-5 border-t border-white/[0.07]">
            <p className="text-ink-muted text-xs">
              Code your solution in the editor. The preview updates live as you type.
            </p>
          </div>
        </div>

        {/* Sandpack editor + preview */}
        <div className="flex-1" style={{ minHeight: 0 }}>
          <Sandpack
            theme={sandpackDark}
            template="react"
            files={{ '/App.js': STARTER }}
            options={{
              showNavigator: false,
              showTabs: true,
              showLineNumbers: true,
              showInlineErrors: true,
              autorun: true,
              editorHeight: 'calc(100vh - 52px)',
              resizablePanels: true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
