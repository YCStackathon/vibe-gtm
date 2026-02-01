import { useEffect, useState } from 'react'
import { listProposals } from '../api/proposals'
import type { Proposal } from '../types/proposal'

interface CyberProposalsProps {
  campaignId: string
}

const SCORE_COLORS: Record<Proposal['score_label'], string> = {
  perfect: 'var(--neon-green)',
  medium: 'var(--neon-amber)',
  low: 'var(--neon-cyan)',
  none: 'var(--text-muted)',
}

const SCORE_LABELS: Record<Proposal['score_label'], string> = {
  perfect: 'PERFECT',
  medium: 'MEDIUM',
  low: 'LOW',
  none: 'NONE',
}

function ScoreBadge({ scoreLabel }: { scoreLabel: Proposal['score_label'] }) {
  const color = SCORE_COLORS[scoreLabel]
  const dimmed = scoreLabel === 'low' || scoreLabel === 'none'

  return (
    <span
      className={`px-2 py-1 font-mono text-xs rounded border ${dimmed ? 'opacity-60' : ''}`}
      style={{
        color,
        borderColor: color,
        backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
      }}
    >
      {SCORE_LABELS[scoreLabel]}
    </span>
  )
}

function ProposalRow({ proposal }: { proposal: Proposal }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-[var(--border-dim)] rounded bg-[var(--void)] overflow-hidden">
      {/* Collapsed Row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-4 text-left hover:bg-[var(--panel-elevated)]/50 transition-colors"
      >
        <span className="font-mono text-xs text-[var(--text-muted)] w-6">
          {expanded ? '[-]' : '[+]'}
        </span>
        <span className="flex-1 font-mono text-sm text-[var(--text-primary)] truncate">
          {proposal.lead_name}
        </span>
        <ScoreBadge scoreLabel={proposal.score_label} />
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-[var(--border-dim)] bg-[var(--panel-bg)]/30">
          {/* Reason */}
          <div className="mb-4">
            <h4 className="font-mono text-xs text-[var(--neon-magenta)] mb-2">
              MATCH_REASON
            </h4>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {proposal.reason}
            </p>
          </div>

          {/* Matches */}
          {proposal.matches.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-mono text-xs text-[var(--neon-cyan)]">
                CONNECTION_POINTS [{proposal.matches.length}]
              </h4>
              {proposal.matches.map((match, i) => (
                <div
                  key={i}
                  className="p-3 bg-[var(--void)] rounded border border-[var(--border-dim)]"
                >
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-[var(--neon-green)] font-mono text-xs shrink-0">
                      YOU:
                    </span>
                    <span className="text-sm text-[var(--text-primary)]">
                      {match.founder_claim}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-[var(--neon-amber)] font-mono text-xs shrink-0">
                      THEM:
                    </span>
                    <span className="text-sm text-[var(--text-primary)]">
                      {match.lead_claim}
                    </span>
                  </div>
                  <a
                    href={match.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono text-[var(--neon-cyan)] hover:underline"
                  >
                    <span>[{match.source_readable}]</span>
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
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* No matches message */}
          {proposal.matches.length === 0 && proposal.score === 0 && (
            <p className="text-xs text-[var(--text-muted)] font-mono">
              // No specific connection points identified
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function CyberProposals({ campaignId }: CyberProposalsProps) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProposals = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listProposals(campaignId)
      setProposals(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load proposals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProposals()
  }, [campaignId])

  if (loading) {
    return (
      <div className="cyber-panel rounded-lg p-8 text-center">
        <span className="font-mono text-sm text-[var(--text-muted)] animate-pulse">
          LOADING_PROPOSALS...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="cyber-panel rounded-lg p-8 text-center">
        <span className="font-mono text-sm text-red-400">ERROR: {error}</span>
        <button
          onClick={fetchProposals}
          className="mt-4 px-4 py-2 font-mono text-xs border border-[var(--neon-cyan)] text-[var(--neon-cyan)] rounded hover:bg-[var(--neon-cyan)]/10"
        >
          RETRY
        </button>
      </div>
    )
  }

  if (proposals.length === 0) {
    return (
      <div className="cyber-panel rounded-lg p-8 text-center">
        <h3 className="font-mono text-sm text-[var(--text-muted)] mb-2">
          NO_PROPOSALS_YET
        </h3>
        <p className="text-xs text-[var(--text-muted)]">
          Proposals will appear here as leads are extracted.
          <br />
          Make sure you've extracted your founder identity first.
        </p>
      </div>
    )
  }

  return (
    <div className="cyber-panel rounded-lg overflow-hidden">
      <div className="bg-[var(--panel-elevated)] px-4 py-3 border-b border-[var(--border-dim)]">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-xs text-[var(--neon-green)]">
            OUTREACH_PROPOSALS
          </h3>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchProposals}
              className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--neon-cyan)] transition-colors"
              title="Refresh proposals"
            >
              [REFRESH]
            </button>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              [{proposals.length} proposals]
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {proposals.map((proposal) => (
          <ProposalRow key={proposal.id} proposal={proposal} />
        ))}
      </div>
    </div>
  )
}
