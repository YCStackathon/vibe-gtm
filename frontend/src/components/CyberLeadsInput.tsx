import { useState } from 'react'
import type { Lead } from '../types/campaign'
import type { LeadStreamState } from '../hooks/useMultipleExtractionStreams'

interface CyberLeadsInputProps {
  leads: Lead[]
  leadStates: Map<string, LeadStreamState>
  onParse: (rawText: string) => Promise<boolean>
  isParsing: boolean
}

function LeadStatusIndicator({
  lead,
  streamState,
}: {
  lead: Lead
  streamState: LeadStreamState | undefined
}) {
  const status = streamState?.status ?? lead.status
  const progress = streamState?.progress

  switch (status) {
    case 'pending':
      return (
        <span className="text-[var(--text-muted)] font-mono text-xs">PENDING</span>
      )
    case 'connecting':
    case 'streaming':
    case 'processing':
      return (
        <span className="text-[var(--neon-cyan)] font-mono text-xs flex items-center gap-2">
          <span className="animate-pulse">
            {progress !== undefined && progress > 0 ? `${progress}%` : '...'}
          </span>
          <span className="w-2 h-2 rounded-full bg-[var(--neon-cyan)] animate-pulse" />
        </span>
      )
    case 'completed':
      return (
        <span className="text-[var(--neon-green)] font-mono text-xs flex items-center gap-1">
          <span>OK</span>
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </span>
      )
    case 'error':
      return (
        <span
          className="text-[var(--neon-magenta)] font-mono text-xs flex items-center gap-1 cursor-help"
          title={lead.error || streamState?.error || 'Unknown error'}
        >
          <span>ERR</span>
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </span>
      )
    default:
      return <span className="text-[var(--text-muted)] text-xs">-</span>
  }
}

export function CyberLeadsInput({
  leads,
  leadStates,
  onParse,
  isParsing,
}: CyberLeadsInputProps) {
  const [text, setText] = useState('')

  const handleParse = async () => {
    if (!text.trim() || isParsing) return
    const success = await onParse(text)
    if (success) {
      setText('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleParse()
    }
  }

  return (
    <div className="space-y-6">
      {/* Parsed Queries Section - NOW FIRST */}
      {leads.length > 0 && (
        <div className="cyber-panel rounded-lg overflow-hidden">
          <div className="bg-[var(--panel-elevated)] px-4 py-3 border-b border-[var(--border-dim)]">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-xs text-[var(--neon-green)]">
                PARSED_QUERIES
              </h3>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                [{leads.length} leads]
              </span>
            </div>
          </div>

          <div className="p-4 space-y-2">
            {leads.map((lead, index) => {
              const streamState = leadStates.get(lead.id)

              return (
                <div
                  key={lead.id}
                  className="flex items-center gap-3 px-3 py-2 bg-[var(--void)] rounded border border-[var(--border-dim)]"
                >
                  <span className="text-[var(--text-muted)] font-mono text-xs">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 font-mono text-sm text-[var(--text-primary)] truncate">
                    {lead.query}
                  </span>
                  <LeadStatusIndicator lead={lead} streamState={streamState} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Input Section - NOW SECOND */}
      <div className="cyber-panel rounded-lg overflow-hidden">
        <div className="bg-[var(--panel-elevated)] px-4 py-3 border-b border-[var(--border-dim)]">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs text-[var(--neon-cyan)]">
              LEAD_INPUT_MODULE
            </h3>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              [{text.length}/10000]
            </span>
          </div>
        </div>

        <div className="p-4">
          <p className="text-xs text-[var(--text-muted)] mb-4">
            // Paste leads in any format - CSV, bullet points, or plain text
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={10000}
            placeholder={`Paste your leads in any format:
- Joshua Alphonse - Mux Community Engineer
- Ernie Ho, Namecard.ai CEO
John Smith Acme Corp
jane@company.com, Jane Doe, Product Manager`}
            className="w-full h-48 px-3 py-2 bg-[var(--void)] border border-[var(--border-dim)] rounded
                       font-mono text-sm text-[var(--text-primary)]
                       placeholder:text-[var(--text-muted)]/50
                       focus:outline-none focus:border-[var(--neon-cyan)]
                       resize-none transition-colors"
          />

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-mono text-[var(--text-muted)]">
              CMD+ENTER to parse
            </span>
            <button
              onClick={handleParse}
              disabled={!text.trim() || isParsing}
              className={`
                px-4 py-2 font-mono text-xs rounded border transition-all
                ${
                  !text.trim() || isParsing
                    ? 'border-[var(--border-dim)] text-[var(--text-muted)] cursor-not-allowed'
                    : 'border-[var(--neon-cyan)] text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/10 hover:shadow-[0_0_10px_var(--neon-cyan)]'
                }
              `}
            >
              {isParsing ? (
                <span className="flex items-center gap-2">
                  <span className="animate-pulse">...</span>
                  PARSING...
                </span>
              ) : (
                'PARSE_LEADS'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
