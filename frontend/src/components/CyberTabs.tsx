interface Tab {
  id: string
  label: string
}

interface CyberTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function CyberTabs({ tabs, activeTab, onTabChange }: CyberTabsProps) {
  return (
    <div className="flex items-center gap-1 mb-6 border-b border-[var(--border-dim)]">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative px-4 py-2 font-mono text-xs transition-colors
              ${
                isActive
                  ? 'text-[var(--neon-cyan)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }
            `}
          >
            <span className="relative z-10">{tab.label}</span>
            {isActive && (
              <>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--neon-cyan)]" />
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--neon-cyan)] blur-sm" />
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}
