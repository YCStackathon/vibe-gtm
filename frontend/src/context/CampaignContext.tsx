import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import * as campaignApi from '../api/campaigns'
import type { Campaign, CampaignListItem } from '../types/campaign'
import type { FounderProfile } from '../types/profile'

interface CampaignContextValue {
  // List of all campaigns
  campaigns: CampaignListItem[]
  // The campaign currently being viewed
  currentCampaign: Campaign | null
  // The campaign currently being processed (extraction in progress)
  campaignInProgress: Campaign | null
  // Loading states
  isLoadingList: boolean
  isLoadingCampaign: boolean
  isSaving: boolean
  saveError: string | null
  // Computed: is the current campaign the one being processed?
  isCurrentCampaignProcessing: boolean
  // Actions
  selectCampaign: (id: string) => Promise<void>
  createCampaign: (name: string) => Promise<void>
  updateProfile: (profile: FounderProfile) => void
  refreshList: () => Promise<void>
  // Start/stop processing
  startProcessing: () => void
  finishProcessing: (profile: FounderProfile) => Promise<void>
  cancelProcessing: () => void
}

const CampaignContext = createContext<CampaignContextValue | null>(null)

const DEBOUNCE_MS = 500

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([])
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null)
  const [campaignInProgress, setCampaignInProgress] = useState<Campaign | null>(null)
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingProfileRef = useRef<FounderProfile | null>(null)
  const currentCampaignIdRef = useRef<string | null>(null)
  // Use ref to track processing campaign to avoid stale closure issues
  const campaignInProgressRef = useRef<Campaign | null>(null)
  // Cache full campaign data to avoid network requests when switching
  const campaignCacheRef = useRef<Map<string, Campaign>>(new Map())

  // Keep refs in sync
  useEffect(() => {
    currentCampaignIdRef.current = currentCampaign?.id ?? null
  }, [currentCampaign?.id])

  useEffect(() => {
    campaignInProgressRef.current = campaignInProgress
  }, [campaignInProgress])

  // Computed: is current campaign being processed?
  const isCurrentCampaignProcessing =
    currentCampaign !== null &&
    campaignInProgress !== null &&
    currentCampaign.id === campaignInProgress.id

  // Flush pending save
  const flushSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    const profile = pendingProfileRef.current
    const campaignId = currentCampaignIdRef.current

    if (!profile || !campaignId) return

    pendingProfileRef.current = null
    setIsSaving(true)
    setSaveError(null)

    try {
      await campaignApi.updateCampaignProfile(campaignId, profile)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }, [])

  // Load campaigns on mount
  useEffect(() => {
    const loadCampaigns = async () => {
      setIsLoadingList(true)
      try {
        const list = await campaignApi.listCampaigns()
        setCampaigns(list)

        // Auto-select most recent campaign
        if (list.length > 0) {
          setIsLoadingCampaign(true)
          const campaign = await campaignApi.getCampaign(list[0].id)
          campaignCacheRef.current.set(campaign.id, campaign)
          setCurrentCampaign(campaign)
          setIsLoadingCampaign(false)
        }
      } catch (err) {
        console.error('Failed to load campaigns:', err)
      } finally {
        setIsLoadingList(false)
      }
    }

    loadCampaigns()
  }, [])

  const refreshList = useCallback(async () => {
    try {
      const list = await campaignApi.listCampaigns()
      setCampaigns(list)
    } catch (err) {
      console.error('Failed to refresh campaigns:', err)
    }
  }, [])

  const selectCampaign = useCallback(
    async (id: string) => {
      console.log('selectCampaign called:', id)

      // Don't wait for flush - do it in background
      flushSave()
      setSaveError(null)

      // Check cache first to avoid network request blocking during extraction
      const cached = campaignCacheRef.current.get(id)
      if (cached) {
        console.log('Using cached campaign:', cached.name)
        setCurrentCampaign(cached)
        return
      }

      setIsLoadingCampaign(true)

      try {
        console.log('Fetching campaign...')
        const campaign = await campaignApi.getCampaign(id)
        console.log('Campaign fetched:', campaign.name)
        campaignCacheRef.current.set(campaign.id, campaign)
        setCurrentCampaign(campaign)
      } catch (err) {
        console.error('Failed to load campaign:', err)
      } finally {
        setIsLoadingCampaign(false)
      }
    },
    [flushSave]
  )

  const createCampaign = useCallback(
    async (name: string) => {
      // Flush any pending save before creating
      await flushSave()

      const newCampaign = await campaignApi.createCampaign(name)
      setCampaigns((prev) => [newCampaign, ...prev])

      // Auto-select the new campaign
      const fullCampaign: Campaign = {
        ...newCampaign,
        profile: null,
      }
      campaignCacheRef.current.set(fullCampaign.id, fullCampaign)
      setCurrentCampaign(fullCampaign)
    },
    [flushSave]
  )

  const updateProfile = useCallback((profile: FounderProfile) => {
    // Optimistic update
    setCurrentCampaign((prev) => {
      if (!prev) return null
      const updated = { ...prev, profile }
      // Update cache
      campaignCacheRef.current.set(prev.id, updated)
      return updated
    })

    // Store pending profile
    pendingProfileRef.current = profile

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Schedule debounced save
    saveTimeoutRef.current = setTimeout(async () => {
      const profileToSave = pendingProfileRef.current
      const campaignId = currentCampaignIdRef.current

      if (!profileToSave || !campaignId) return

      pendingProfileRef.current = null
      setIsSaving(true)
      setSaveError(null)

      try {
        await campaignApi.updateCampaignProfile(campaignId, profileToSave)
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to save')
      } finally {
        setIsSaving(false)
      }
    }, DEBOUNCE_MS)
  }, [])

  // Start processing the current campaign
  const startProcessing = useCallback(() => {
    if (currentCampaign) {
      setCampaignInProgress(currentCampaign)
      campaignInProgressRef.current = currentCampaign
    }
  }, [currentCampaign])

  // Finish processing with the extracted profile
  const finishProcessing = useCallback(
    async (profile: FounderProfile) => {
      // Use ref to get the campaign that was being processed
      const processingCampaign = campaignInProgressRef.current
      if (!processingCampaign) {
        console.error('No campaign in progress')
        return
      }

      const targetId = processingCampaign.id
      console.log('Finishing processing for campaign:', targetId)

      // Save to the campaign that was being processed
      try {
        await campaignApi.updateCampaignProfile(targetId, profile)
        console.log('Profile saved successfully')
      } catch (err) {
        console.error('Failed to save extracted profile:', err)
      }

      // Update cache for the target campaign
      const existingCached = campaignCacheRef.current.get(targetId)
      if (existingCached) {
        campaignCacheRef.current.set(targetId, { ...existingCached, profile })
      }

      // Update current campaign if it's the same one
      const currentId = currentCampaignIdRef.current
      if (currentId === targetId) {
        setCurrentCampaign((prev) => (prev ? { ...prev, profile } : null))
      }

      // Clear processing state
      setCampaignInProgress(null)
      campaignInProgressRef.current = null
    },
    []
  )

  // Cancel processing (on error)
  const cancelProcessing = useCallback(() => {
    setCampaignInProgress(null)
    campaignInProgressRef.current = null
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return (
    <CampaignContext.Provider
      value={{
        campaigns,
        currentCampaign,
        campaignInProgress,
        isLoadingList,
        isLoadingCampaign,
        isSaving,
        saveError,
        isCurrentCampaignProcessing,
        selectCampaign,
        createCampaign,
        updateProfile,
        refreshList,
        startProcessing,
        finishProcessing,
        cancelProcessing,
      }}
    >
      {children}
    </CampaignContext.Provider>
  )
}

export function useCampaign() {
  const context = useContext(CampaignContext)
  if (!context) {
    throw new Error('useCampaign must be used within CampaignProvider')
  }
  return context
}
