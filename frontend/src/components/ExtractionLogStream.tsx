import { useEffect, useRef } from 'react'
import type { ExtractionStreamState, LogType } from '../hooks/useExtractionStream'

interface ExtractionLogStreamProps {
  state: ExtractionStreamState
  onClose?: () => void
}

const logTypeStyles: Record<LogType, { color: string; prefix: string }> = {
  info: { color: 'text-[var(--text-secondary)]', prefix: '[INFO]' },
  progress: { color: 'text-[var(--neon-cyan)]', prefix: '[....]' },
  success: { color: 'text-[var(--neon-green)]', prefix: '[OK]' },
  error: { color: 'text-[var(--neon-magenta)]', prefix: '[ERR]' },
}

export function ExtractionLogStream({ state, onClose }: ExtractionLogStreamProps) {
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.logs])

  const isActive = state.status === 'connecting' || state.status === 'streaming'

  return (
    <div className="cyber-panel rounded-lg overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-dim)] bg-[var(--surface)]/50">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[var(--neon-magenta)]/80" />
            <div className="w-3 h-3 rounded-full bg-[var(--neon-amber)]/80" />
            <div className="w-3 h-3 rounded-full bg-[var(--neon-green)]/80" />
          </div>
          <span className="font-mono text-xs text-[var(--text-muted)]">
            whoami_extraction.sh
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Progress Bar */}
          {isActive && (
            <div className="flex items-center gap-2">
              <div className="w-32 h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--neon-cyan)] transition-all duration-300"
                  style={{ width: `${state.progress}%` }}
                />
              </div>
              <span className="font-mono text-xs text-[var(--neon-cyan)]">
                {state.progress}%
              </span>
            </div>
          )}

          {/* Status Badge */}
          <span
            className={`
              font-mono text-xs px-2 py-0.5 rounded
              ${state.status === 'completed' ? 'bg-[var(--neon-green)]/20 text-[var(--neon-green)]' : ''}
              ${state.status === 'error' ? 'bg-[var(--neon-magenta)]/20 text-[var(--neon-magenta)]' : ''}
              ${isActive ? 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] animate-pulse' : ''}
              ${state.status === 'idle' ? 'bg-[var(--surface)] text-[var(--text-muted)]' : ''}
            `}
          >
            {state.status.toUpperCase()}
          </span>

          {onClose && (state.status === 'completed' || state.status === 'error') && (
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Terminal Body */}
      <div className="h-64 overflow-y-auto font-mono text-sm p-4 bg-[#0a0a0f]">
        {/* Initial prompt */}
        <div className="text-[var(--text-muted)] mb-2">
          <span className="text-[var(--neon-green)]">$</span> ./whoami_extraction.sh
        </div>

        {/* Connecting state */}
        {state.status === 'connecting' && (
          <div className="text-[var(--neon-cyan)] animate-pulse">
            Connecting to extraction pipeline...
          </div>
        )}

        {/* Log entries */}
        {state.logs.map((log, index) => {
          const style = logTypeStyles[log.type]
          return (
            <div key={index} className="flex gap-2 leading-relaxed">
              <span className={`${style.color} shrink-0`}>{style.prefix}</span>
              <span className="text-[var(--text-primary)]">{log.message}</span>
            </div>
          )
        })}

        {/* Completion message */}
        {state.status === 'completed' && (
          <div className="mt-4 pt-4 border-t border-[var(--border-dim)]">
            <div className="text-[var(--neon-green)]">
              ✓ Extraction complete
            </div>
            <div className="text-[var(--text-muted)] text-xs mt-1">
              extraction_id: {state.extractionId}
            </div>
          </div>
        )}

        {/* Error message */}
        {state.status === 'error' && (
          <div className="mt-4 pt-4 border-t border-[var(--border-dim)]">
            <div className="text-[var(--neon-magenta)]">
              ✗ Extraction failed: {state.error}
            </div>
          </div>
        )}

        {/* Blinking cursor */}
        {isActive && (
          <div className="flex items-center mt-2">
            <span className="text-[var(--neon-green)]">$</span>
            <span className="ml-2 w-2 h-4 bg-[var(--neon-cyan)] animate-pulse" />
          </div>
        )}

        <div ref={logsEndRef} />
      </div>
    </div>
  )
}
