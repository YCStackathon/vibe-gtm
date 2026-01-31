export function TerminalHeader() {
  return (
    <header className="border-b border-[var(--border-dim)] bg-[var(--terminal-bg)]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 border-2 border-[var(--neon-cyan)] rotate-45 flex items-center justify-center">
                <div className="w-4 h-4 bg-[var(--neon-cyan)] -rotate-45" />
              </div>
              <div className="absolute inset-0 w-10 h-10 border-2 border-[var(--neon-magenta)] rotate-45 blur-sm opacity-50" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight chromatic">
                <span className="neon-cyan">VIBE</span>
                <span className="text-[var(--text-muted)]">_</span>
                <span className="text-[var(--text-primary)]">GTM</span>
              </h1>
              <p className="text-[10px] text-[var(--text-muted)] tracking-[0.3em] uppercase">
                Identity Extraction
              </p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-6 text-xs font-mono">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--neon-green)] animate-pulse" />
              <span className="text-[var(--text-muted)]">SYSTEM_ONLINE</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[var(--text-muted)]">
              <span className="text-[var(--neon-cyan)]">[</span>
              REDUCTO_PIPELINE
              <span className="text-[var(--neon-cyan)]">]</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
