import React from 'react';

interface State {
  error: Error | null;
}

interface Props extends React.PropsWithChildren {
  /** Compact card for use inside the app shell (keeps nav usable). */
  inline?: boolean;
}

/**
 * Keeps a render error in one page from unmounting the whole React tree —
 * the demo degrades to a styled recovery screen instead of a white page.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[NEXUS] render error contained:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const { inline } = this.props;
    return (
      <div
        className={
          inline
            ? 'flex min-h-[50vh] flex-col items-center justify-center px-6 text-center'
            : 'flex min-h-screen flex-col items-center justify-center bg-[#04060d] px-6 text-center'
        }
      >
        {!inline && <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.12),transparent_55%)]" />}
        <div className="relative">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-rose-400">Core destabilized</div>
          <h1 className="mt-4 font-display text-3xl font-bold text-white">NEXUS hit a render fault</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
            One module glitched — the rest of your academic core is safe on disk. Reload to re-enter the cockpit.
          </p>
          <pre className="mx-auto mt-5 max-w-lg overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-[11px] text-rose-300/80">
            {String(this.state.error?.message ?? this.state.error)}
          </pre>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl border border-cyan-400/50 bg-cyan-400/10 px-5 py-2.5 text-[13px] font-semibold text-cyan-200 transition-colors hover:bg-cyan-400/20"
            >
              Reload NEXUS
            </button>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem('makaut-nexus:v1');
                } catch {
                  /* ignore */
                }
                window.location.href = '#/';
                window.location.reload();
              }}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-[13px] text-slate-400 transition-colors hover:border-white/25 hover:text-slate-200"
            >
              Reset local state
            </button>
          </div>
        </div>
      </div>
    );
  }
}
