import { useState } from 'react'
import { extractProfile } from './api/identity'
import { FileDropZone } from './components/FileDropZone'
import { ProfileCard } from './components/ProfileCard'
import { SocialUrlsInput } from './components/SocialUrlsInput'
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
  const [mongoResult, setMongoResult] = useState<string | null>(null)
  const [mongoLoading, setMongoLoading] = useState(false)

  const handleFileSelect = async (file: File) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await extractProfile(file)
      setProfile(response.profile)
      // Pre-fill social URLs from extracted profile
      setSocialUrls({
        linkedin: response.profile.social_urls?.linkedin || '',
        twitter: response.profile.social_urls?.twitter || '',
        github: response.profile.social_urls?.github || '',
        instagram: response.profile.social_urls?.instagram || '',
        facebook: response.profile.social_urls?.facebook || '',
        website: response.profile.social_urls?.website || '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setProfile(null)
    setSocialUrls({
      linkedin: '',
      twitter: '',
      github: '',
      instagram: '',
      facebook: '',
      website: '',
    })
    setError(null)
  }

  const storeTestDocument = async () => {
    setMongoLoading(true)
    setMongoResult(null)
    try {
      const res = await fetch('/api/test-document', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to store document')
      const data = await res.json()
      setMongoResult(`Stored document with ID: ${data.inserted_id}`)
    } catch (err) {
      setMongoResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setMongoLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Vibe GTM</h1>
          <p className="text-gray-600">Upload your CV to create your founder profile</p>
        </div>

        <div className="flex flex-col items-center">
          {!profile ? (
            <>
              <FileDropZone onFileSelect={handleFileSelect} isLoading={isLoading} />
              {error && (
                <p className="mt-4 text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
              )}
            </>
          ) : (
            <>
              <ProfileCard profile={profile} onReset={handleReset} />
              <SocialUrlsInput urls={socialUrls} onChange={setSocialUrls} />
            </>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">MongoDB Test</h2>
          <div className="flex flex-col items-center">
            <button
              onClick={storeTestDocument}
              disabled={mongoLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {mongoLoading ? 'Storing...' : 'Store Test Document'}
            </button>
            {mongoResult && (
              <p className="mt-4 text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">{mongoResult}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
