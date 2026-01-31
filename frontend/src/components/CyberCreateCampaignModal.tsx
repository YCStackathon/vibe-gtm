import { useState } from 'react'

interface CyberCreateCampaignModalProps {
  onClose: () => void
  onCreate: (name: string) => Promise<void>
}

export function CyberCreateCampaignModal({
  onClose,
  onCreate,
}: CyberCreateCampaignModalProps) {
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Campaign name is required')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      await onCreate(trimmedName)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative cyber-panel rounded-lg w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-[var(--panel-elevated)] px-4 py-3 border-b border-[var(--border-dim)]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--neon-cyan)]" />
            <span className="font-mono text-xs text-[var(--text-muted)]">
              CREATE_CAMPAIGN
            </span>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label
              htmlFor="campaign-name"
              className="block font-mono text-xs text-[var(--neon-cyan)] mb-2"
            >
              CAMPAIGN_NAME
            </label>
            <input
              id="campaign-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., YC Judges, TechCrunch Reporters"
              autoFocus
              maxLength={100}
              className="w-full px-3 py-2 font-mono text-sm bg-[var(--panel-elevated)]
                         border border-[var(--border-dim)] rounded
                         focus:border-[var(--neon-cyan)] focus:outline-none
                         text-[var(--text-primary)] placeholder-[var(--text-muted)]"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 border border-red-500/50 bg-red-500/10 rounded font-mono text-xs">
              <span className="text-red-400">ERROR:</span>
              <span className="text-[var(--text-secondary)] ml-2">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 font-mono text-xs border border-[var(--border-dim)] rounded
                         hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]
                         transition-colors disabled:opacity-50"
            >
              [CANCEL]
            </button>
            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="px-4 py-2 font-mono text-xs border border-[var(--neon-cyan)] rounded
                         text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/10
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? '[CREATING...]' : '[CREATE]'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
