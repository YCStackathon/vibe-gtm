interface CyberEmptyStateProps {
  onCreateClick: () => void
}

export function CyberEmptyState({ onCreateClick }: CyberEmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg border border-[var(--border-dim)] bg-[var(--panel-elevated)]">
            <span className="text-3xl text-[var(--neon-cyan)]">+</span>
          </div>
        </div>

        <h2 className="font-mono text-lg text-[var(--text-primary)] mb-2">
          NO_CAMPAIGNS_FOUND
        </h2>

        <p className="font-mono text-sm text-[var(--text-muted)] mb-6">
          Create your first campaign to start building personalized outreach for
          your target audience.
        </p>

        <button
          onClick={onCreateClick}
          className="px-6 py-3 font-mono text-sm border border-[var(--neon-cyan)] rounded
                     text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/10
                     transition-colors glitch-hover"
        >
          [ CREATE_FIRST_CAMPAIGN ]
        </button>
      </div>
    </div>
  )
}
