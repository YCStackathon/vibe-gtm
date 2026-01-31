import { useState } from 'react'
import { extractProfile } from './api/identity'
import { CyberFileDropZone } from './components/CyberFileDropZone'
import { CyberProfileCard } from './components/CyberProfileCard'
import { CyberSocialUrlsInput } from './components/CyberSocialUrlsInput'
import { TerminalHeader } from './components/TerminalHeader'
import type { FounderProfile, SocialUrls } from './types/profile'

function App() {
  const [profile, setProfile] = useState<FounderProfile | null>(null)
  const [socialUrls, setSocialUrls] = useState<SocialUrls>({
    linkedin: '',
    twitter: '',
    github: '',
    instagram: '',
    facebook: '',
    website: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '> VIBE_GTM v1.0.0 initialized',
    '> Awaiting identity payload...',
  ])
  const [mongoResult, setMongoResult] = useState<string | null>(null)
  const [mongoLoading, setMongoLoading] = useState(false)

  const addLog = (message: string) => {
    setTerminalLogs(prev => [...prev, `> ${message}`])
  }

  const handleFileSelect = async (file: File) => {
    setIsLoading(true)
    setError(null)
    addLog(`Processing: ${file.name}`)
    addLog('Connecting to Reducto pipeline...')

    try {
      const response = await extractProfile(file)
      setProfile(response.profile)
      setSocialUrls({
        linkedin: response.profile.social_urls?.linkedin || '',
        twitter: response.profile.social_urls?.twitter || '',
        github: response.profile.social_urls?.github || '',
        instagram: response.profile.social_urls?.instagram || '',
        facebook: response.profile.social_urls?.facebook || '',
        website: response.profile.social_urls?.website || '',
      })
      addLog('Identity extraction complete')
      addLog(`Subject identified: ${response.profile.name || 'UNKNOWN'}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Extraction failed'
      setError(msg)
      addLog(`ERROR: ${msg}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setProfile(null)
    setSocialUrls({
      linkedin: '', twitter: '', github: '',
      instagram: '', facebook: '', website: '',
    })
    setError(null)
    addLog('System reset. Awaiting new payload...')
  }

  const storeTestDocument = async () => {
    setMongoLoading(true)
    setMongoResult(null)
    addLog('Initiating MongoDB test write...')
    try {
      const res = await fetch('/api/test-document', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to store document')
      const data = await res.json()
      setMongoResult(`Stored document with ID: ${data.inserted_id}`)
      addLog(`MongoDB write success: ${data.inserted_id}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setMongoResult(`Error: ${msg}`)
      addLog(`ERROR: MongoDB write failed - ${msg}`)
    } finally {
      setMongoLoading(false)
    }
  }

  return (
    <div className="scanlines crt-flicker min-h-screen bg-[var(--void)]">
      {/* Grid Background Pattern */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--neon-cyan) 1px, transparent 1px),
            linear-gradient(90deg, var(--neon-cyan) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10 min-h-screen">
        <TerminalHeader />

        <main className="container mx-auto px-4 py-8 max-w-6xl">
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
                  className={`${log.includes('ERROR') ? 'text-red-400' : log.includes('complete') || log.includes('identified') || log.includes('success') ? 'neon-green' : 'text-[var(--text-secondary)]'}`}
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
              {!profile ? (
                <CyberFileDropZone
                  onFileSelect={handleFileSelect}
                  isLoading={isLoading}
                />
              ) : (
                <CyberProfileCard
                  profile={profile}
                  onReset={handleReset}
                />
              )}

              {error && (
                <div className="mt-4 p-4 border border-red-500/50 bg-red-500/10 rounded font-mono text-sm">
                  <span className="text-red-400">&#x26A0; SYSTEM_ERROR:</span>
                  <span className="text-[var(--text-secondary)] ml-2">{error}</span>
                </div>
              )}
            </div>

            {/* Right Column - Social Inputs */}
            {profile && (
              <div className="lg:sticky lg:top-24 h-fit">
                <CyberSocialUrlsInput urls={socialUrls} onChange={setSocialUrls} />
              </div>
            )}
          </div>

          {/* MongoDB Test Section */}
          <div className="mt-12 pt-8 border-t border-[var(--border-dim)]">
            <h2 className="font-mono text-xs text-[var(--neon-amber)] mb-4 flex items-center gap-2">
              <span className="w-8 h-px bg-[var(--neon-amber)]" />
              DATABASE_TEST_MODULE
            </h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                onClick={storeTestDocument}
                disabled={mongoLoading}
                className="px-4 py-2 font-mono text-sm border border-[var(--border-dim)] rounded
                           hover:border-[var(--neon-amber)] hover:text-[var(--neon-amber)]
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors glitch-hover"
              >
                {mongoLoading ? '[ STORING... ]' : '[ STORE_TEST_DOC ]'}
              </button>
              {mongoResult && (
                <p className={`text-xs font-mono ${mongoResult.includes('Error') ? 'text-red-400' : 'neon-green'}`}>
                  {mongoResult}
                </p>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-[var(--border-dim)] mt-16 py-6">
          <div className="container mx-auto px-4 text-center">
            <p className="text-[var(--text-muted)] text-xs font-mono">
              <span className="neon-cyan">VIBE_GTM</span> // IDENTITY_EXTRACTION_SYSTEM //
              <span className="text-[var(--neon-magenta)]"> v1.0.0</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
