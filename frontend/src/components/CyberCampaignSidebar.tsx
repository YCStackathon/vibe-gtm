import { useCampaign } from '../context/CampaignContext'
import type { CampaignListItem } from '../types/campaign'

interface CyberCampaignSidebarProps {
  onCreateClick: () => void
}

export function CyberCampaignSidebar({ onCreateClick }: CyberCampaignSidebarProps) {
  const {
    campaigns,
    activeCampaign,
    isLoadingList,
    isSaving,
    saveError,
    selectCampaign,
  } = useCampaign()

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <aside className="w-64 h-screen flex flex-col border-r border-[var(--border-dim)] bg-[var(--panel-bg)]">
      {/* Logo Header */}
      <div className="p-4 border-b border-[var(--border-dim)]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 border-2 border-[var(--neon-cyan)] rotate-45 flex items-center justify-center">
              <div className="w-3 h-3 bg-[var(--neon-cyan)] -rotate-45" />
            </div>
            <div className="absolute inset-0 w-8 h-8 border-2 border-[var(--neon-magenta)] rotate-45 blur-sm opacity-50" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight chromatic">
              <span className="neon-cyan">VIBE</span>
              <span className="text-[var(--text-muted)]">_</span>
              <span className="text-[var(--text-primary)]">GTM</span>
            </h1>
            <p className="text-[8px] text-[var(--text-muted)] tracking-[0.2em] uppercase">
              Identity Extraction
            </p>
          </div>
        </div>
      </div>

      {/* Campaigns Section */}
      <div className="p-4 border-b border-[var(--border-dim)]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-mono text-xs text-[var(--neon-cyan)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--neon-cyan)]" />
            CAMPAIGNS
          </h2>
          {/* Save indicator */}
          <div className="font-mono text-xs">
            {isSaving && (
              <span className="text-[var(--neon-amber)] animate-pulse">SAVING...</span>
            )}
            {saveError && <span className="text-red-400">ERROR</span>}
          </div>
        </div>

        {/* New Campaign Button */}
        <button
          onClick={onCreateClick}
          className="w-full px-3 py-2 font-mono text-xs border border-dashed border-[var(--border-dim)] rounded
                     hover:border-[var(--neon-cyan)] hover:text-[var(--neon-cyan)]
                     transition-colors glitch-hover text-[var(--text-muted)]"
        >
          + NEW_CAMPAIGN
        </button>
      </div>

      {/* Campaign List */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingList ? (
          <div className="p-4 text-center">
            <span className="font-mono text-xs text-[var(--text-muted)] animate-pulse">
              LOADING...
            </span>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-4 text-center">
            <span className="font-mono text-xs text-[var(--text-muted)]">
              NO_CAMPAIGNS
            </span>
          </div>
        ) : (
          <ul className="p-2 space-y-1">
            {campaigns.map((campaign: CampaignListItem) => (
              <li key={campaign.id}>
                <button
                  onClick={() => selectCampaign(campaign.id)}
                  className={`w-full text-left px-3 py-2 rounded font-mono text-sm transition-colors
                    ${
                      activeCampaign?.id === campaign.id
                        ? 'bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)]'
                        : 'border border-transparent hover:bg-[var(--panel-elevated)] hover:border-[var(--border-dim)] text-[var(--text-secondary)]'
                    }`}
                >
                  <div className="truncate">{campaign.name}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">
                    {formatDate(campaign.updated_at)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--border-dim)]">
        <p className="font-mono text-xs text-[var(--text-muted)] text-center">
          {campaigns.length} CAMPAIGN{campaigns.length !== 1 ? 'S' : ''}
        </p>
      </div>
    </aside>
  )
}
