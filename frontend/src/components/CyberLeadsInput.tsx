import { useState } from 'react'

interface CyberLeadsInputProps {
  queries: string[]
  onParse: (rawText: string) => Promise<boolean>
  isParsing: boolean
}

export function CyberLeadsInput({ queries, onParse, isParsing }: CyberLeadsInputProps) {
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
      {/* Input Section */}
      <div className="cyber-panel rounded-lg overflow-hidden">
        <div className="bg-[var(--panel-elevated)] px-4 py-3 border-b border-[var(--border-dim)]">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs text-[var(--neon-cyan)]">LEAD_INPUT_MODULE</h3>
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
                  <span className="animate-pulse">◌</span>
                  PARSING...
                </span>
              ) : (
                'PARSE_LEADS'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Parsed Queries Section */}
      {queries.length > 0 && (
        <div className="cyber-panel rounded-lg overflow-hidden">
          <div className="bg-[var(--panel-elevated)] px-4 py-3 border-b border-[var(--border-dim)]">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-xs text-[var(--neon-green)]">PARSED_QUERIES</h3>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                [{queries.length} leads]
              </span>
            </div>
          </div>

          <div className="p-4 space-y-2">
            {queries.map((query, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-3 py-2 bg-[var(--void)] rounded border border-[var(--border-dim)]"
              >
                <span className="text-[var(--text-muted)] font-mono text-xs">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 font-mono text-sm text-[var(--text-primary)]">
                  {query}
                </span>
                <span className="text-[var(--text-muted)] text-xs">◌</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
