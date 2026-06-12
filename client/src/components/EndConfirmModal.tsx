interface EndConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function EndConfirmModal({ onConfirm, onCancel }: EndConfirmModalProps) {
  return (
    <div className="absolute inset-0 bg-stage/85 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-surface border border-white/[0.08] rounded-2xl p-7 text-center max-w-xs mx-4 shadow-2xl animate-scale-in">
        <div className="w-12 h-12 rounded-full bg-danger/15 border border-danger/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-danger-bright" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 11.504A9.998 9.998 0 0112 2c2.29 0 4.408.772 6.1 2.063" />
          </svg>
        </div>
        <h2 className="text-ink font-semibold text-base mb-1.5">End interview?</h2>
        <p className="text-ink-muted text-xs mb-6 leading-relaxed">
          Your session will end and a performance report will be generated from the transcript so far.
        </p>
        <div className="flex gap-2.5 justify-center">
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-danger hover:bg-danger-bright text-white text-sm font-medium rounded-xl transition-colors"
          >
            End &amp; get report
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-white/[0.08] text-ink-secondary hover:border-white/20 hover:text-ink text-sm font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
