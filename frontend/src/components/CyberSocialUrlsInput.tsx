import type { SocialUrls } from '../types/profile'

interface CyberSocialUrlsInputProps {
  urls: SocialUrls
  onChange: (urls: SocialUrls) => void
}

const SOCIAL_FIELDS: { key: keyof SocialUrls; label: string; icon: string; color: string }[] = [
  { key: 'linkedin', label: 'LinkedIn', icon: '▣', color: 'var(--neon-cyan)' },
  { key: 'twitter', label: 'Twitter/X', icon: '✕', color: 'var(--text-primary)' },
  { key: 'github', label: 'GitHub', icon: '◈', color: 'var(--neon-magenta)' },
  { key: 'instagram', label: 'Instagram', icon: '◎', color: 'var(--neon-amber)' },
  { key: 'facebook', label: 'Facebook', icon: '▤', color: 'var(--neon-cyan)' },
  { key: 'website', label: 'Website', icon: '◉', color: 'var(--neon-green)' },
]

export function CyberSocialUrlsInput({ urls, onChange }: CyberSocialUrlsInputProps) {
  const handleChange = (field: keyof SocialUrls) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...urls, [field]: e.target.value })
  }

  const filledCount = Object.values(urls).filter(Boolean).length

  return (
    <div className="cyber-panel rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-[var(--panel-elevated)] px-4 py-3 border-b border-[var(--border-dim)]">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-xs text-[var(--neon-cyan)]">
            SOCIAL_LINKS_MODULE
          </h3>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            [{filledCount}/{SOCIAL_FIELDS.length}]
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-xs text-[var(--text-muted)] mb-4">
          // Augment identity with social graph data
        </p>

        {SOCIAL_FIELDS.map(({ key, label, icon, color }) => (
          <div key={key} className="group">
            <label className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] mb-1">
              <span style={{ color }}>{icon}</span>
              {label}
              {urls[key] && <span className="text-[var(--neon-green)]">&#x2713;</span>}
            </label>
            <div className="relative">
              <input
                type="url"
                value={urls[key] || ''}
                onChange={handleChange(key)}
                placeholder={`https://${key === 'website' ? 'your-site.com' : key + '.com/...'}`}
                className="w-full px-3 py-2 bg-[var(--void)] border border-[var(--border-dim)] rounded
                           font-mono text-sm text-[var(--text-primary)]
                           placeholder:text-[var(--text-muted)]/50
                           focus:outline-none focus:border-[var(--neon-cyan)]
                           transition-colors"
              />
              <div
                className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-4 opacity-0 group-focus-within:opacity-100 transition-opacity"
                style={{ backgroundColor: color }}
              />
            </div>
          </div>
        ))}

        {/* Status Bar */}
        <div className="mt-4 pt-4 border-t border-[var(--border-dim)]">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--text-muted)]">SYNC_STATUS:</span>
            <span className={filledCount > 0 ? 'neon-green' : 'text-[var(--text-muted)]'}>
              {filledCount > 0 ? 'READY_TO_PROCESS' : 'AWAITING_INPUT'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
