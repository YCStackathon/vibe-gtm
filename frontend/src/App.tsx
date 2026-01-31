import { useState } from 'react'
import { extractProfile } from './api/identity'
import * as campaignApi from './api/campaigns'
import { CyberCampaignSidebar } from './components/CyberCampaignSidebar'
import { CyberCreateCampaignModal } from './components/CyberCreateCampaignModal'
import { CyberEmptyState } from './components/CyberEmptyState'
import { CyberFileDropZone } from './components/CyberFileDropZone'
import { CyberProfileCard } from './components/CyberProfileCard'
import { CyberSocialUrlsInput } from './components/CyberSocialUrlsInput'
import { CampaignProvider, useCampaign } from './context/CampaignContext'
import type { SocialUrls } from './types/profile'

function AppContent() {
  const {
    campaigns,
    activeCampaign,
    isLoadingList,
    isLoadingCampaign,
    isSaving,
    saveError,
    extractingCampaignId,
    createCampaign,
    updateProfile,
    setExtractingCampaignId,
  } = useCampaign()

  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '> VIBE_GTM v1.0.0 initialized',
    '> Awaiting identity payload...',
  ])

  const addLog = (message: string) => {
    setTerminalLogs((prev) => [...prev, `> ${message}`])
  }

  const handleFileSelect = async (file: File) => {
    const targetCampaignId = activeCampaign?.id
    if (!targetCampaignId) return

    setExtractingCampaignId(targetCampaignId)
    setError(null)
    addLog(`Processing: ${file.name}`)
    addLog('Connecting to Reducto pipeline...')

    try {
      const response = await extractProfile(file)

      // Save to the campaign we started with
      await campaignApi.updateCampaignProfile(targetCampaignId, response.profile)

      // Only update local state if still viewing that campaign
      if (activeCampaign?.id === targetCampaignId) {
        updateProfile(response.profile)
      }

      addLog('Identity extraction complete')
      addLog(`Subject identified: ${response.profile.name || 'UNKNOWN'}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Extraction failed'
      setError(msg)
      addLog(`ERROR: ${msg}`)
    } finally {
      setExtractingCampaignId(null)
    }
  }

  const handleReset = () => {
    if (!activeCampaign) return

    // Clear profile for current campaign
    const emptyProfile = {
      name: null,
      first_name: null,
      middle_name: null,
      last_name: null,
      current_job_title: null,
      email: null,
      phone: null,
      location: null,
      summary: null,
      skills: [],
      education: [],
      experience: [],
      social_urls: {
        linkedin: null,
        twitter: null,
        github: null,
        instagram: null,
        facebook: null,
        website: null,
      },
    }
    updateProfile(emptyProfile)
    setError(null)
    addLog('Profile reset. Awaiting new payload...')
  }

  const handleSocialUrlsChange = (urls: SocialUrls) => {
    if (!activeCampaign?.profile) return

    updateProfile({
      ...activeCampaign.profile,
      social_urls: urls,
    })
  }

  const profile = activeCampaign?.profile
  const socialUrls: SocialUrls = {
    linkedin: profile?.social_urls?.linkedin || '',
    twitter: profile?.social_urls?.twitter || '',
    github: profile?.social_urls?.github || '',
    instagram: profile?.social_urls?.instagram || '',
    facebook: profile?.social_urls?.facebook || '',
    website: profile?.social_urls?.website || '',
  }

  // Show empty state if no campaigns
  const showEmptyState = !isLoadingList && campaigns.length === 0

  return (
    <div className="scanlines crt-flicker flex h-screen bg-[var(--void)]">
      {/* Grid Background Pattern */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--neon-cyan) 1px, transparent 1px),
            linear-gradient(90deg, var(--neon-cyan) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Sidebar */}
      <div className="relative z-20">
        <CyberCampaignSidebar onCreateClick={() => setShowCreateModal(true)} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        {showEmptyState ? (
          <CyberEmptyState onCreateClick={() => setShowCreateModal(true)} />
        ) : isLoadingList || isLoadingCampaign ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <span className="font-mono text-sm text-[var(--text-muted)] animate-pulse">
              LOADING...
            </span>
          </div>
        ) : activeCampaign ? (
          <div className="min-h-screen">
            {/* Campaign Header */}
            <header className="border-b border-[var(--border-dim)] bg-[var(--panel-bg)]/80 backdrop-blur-sm sticky top-0 z-10">
              <div className="container mx-auto px-6 py-4 max-w-6xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="font-mono text-lg neon-cyan">
                      {activeCampaign.name}
                    </h1>
                    <p className="font-mono text-xs text-[var(--text-muted)]">
                      CAMPAIGN_ID: {activeCampaign.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <div className="font-mono text-xs">
                    {isSaving && (
                      <span className="text-[var(--neon-amber)] animate-pulse">
                        SAVING...
                      </span>
                    )}
                    {saveError && <span className="text-red-400">SAVE_ERROR</span>}
                    {!isSaving && !saveError && profile && (
                      <span className="neon-green">SYNCED</span>
                    )}
                  </div>
                </div>
              </div>
            </header>

            <main className="container mx-auto px-6 py-8 max-w-6xl">
              {/* Terminal Log Window */}
              <div className="cyber-panel rounded mb-8 p-4 font-mono text-xs">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border-dim)]">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-2 text-[var(--text-muted)]">system_log.sh</span>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {terminalLogs.map((log, i) => (
                    <div
                      key={i}
                      className={`${
                        log.includes('ERROR')
                          ? 'text-red-400'
                          : log.includes('complete') ||
                              log.includes('identified') ||
                              log.includes('success')
                            ? 'neon-green'
                            : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                  <span className="terminal-cursor" />
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid lg:grid-cols-[1fr,400px] gap-8">
                {/* Left Column - Upload or Profile */}
                <div>
                  {!profile || !profile.name ? (
                    <CyberFileDropZone
                      onFileSelect={handleFileSelect}
                      isLoading={extractingCampaignId === activeCampaign?.id}
                    />
                  ) : (
                    <CyberProfileCard profile={profile} onReset={handleReset} />
                  )}

                  {error && (
                    <div className="mt-4 p-4 border border-red-500/50 bg-red-500/10 rounded font-mono text-sm">
                      <span className="text-red-400">SYSTEM_ERROR:</span>
                      <span className="text-[var(--text-secondary)] ml-2">{error}</span>
                    </div>
                  )}
                </div>

                {/* Right Column - Social Inputs */}
                {profile && profile.name && (
                  <div className="lg:sticky lg:top-24 h-fit">
                    <CyberSocialUrlsInput
                      urls={socialUrls}
                      onChange={handleSocialUrlsChange}
                    />
                  </div>
                )}
              </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-[var(--border-dim)] mt-16 py-6">
              <div className="container mx-auto px-6 text-center">
                <p className="text-[var(--text-muted)] text-xs font-mono">
                  <span className="neon-cyan">VIBE_GTM</span> // IDENTITY_EXTRACTION_SYSTEM
                  //<span className="text-[var(--neon-magenta)]"> v1.0.0</span>
                </p>
              </div>
            </footer>
          </div>
        ) : null}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <CyberCreateCampaignModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createCampaign}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <CampaignProvider>
      <AppContent />
    </CampaignProvider>
  )
}

export default App
