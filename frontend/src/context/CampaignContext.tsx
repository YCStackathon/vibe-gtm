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
  campaigns: CampaignListItem[]
  activeCampaign: Campaign | null
  isLoadingList: boolean
  isLoadingCampaign: boolean
  isSaving: boolean
  saveError: string | null
  extractingCampaignId: string | null
  selectCampaign: (id: string) => Promise<void>
  createCampaign: (name: string) => Promise<void>
  updateProfile: (profile: FounderProfile) => void
  refreshList: () => Promise<void>
  setExtractingCampaignId: (id: string | null) => void
}

const CampaignContext = createContext<CampaignContextValue | null>(null)

const DEBOUNCE_MS = 500

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([])
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null)
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [extractingCampaignId, setExtractingCampaignId] = useState<string | null>(null)

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingProfileRef = useRef<FounderProfile | null>(null)
  const activeCampaignIdRef = useRef<string | null>(null)

  // Keep ref in sync with active campaign
  useEffect(() => {
    activeCampaignIdRef.current = activeCampaign?.id ?? null
  }, [activeCampaign?.id])

  // Flush pending save
  const flushSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    const profile = pendingProfileRef.current
    const campaignId = activeCampaignIdRef.current

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
          setActiveCampaign(campaign)
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
      // Flush any pending save before switching
      await flushSave()

      setIsLoadingCampaign(true)
      setSaveError(null)

      try {
        const campaign = await campaignApi.getCampaign(id)
        setActiveCampaign(campaign)
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
      setActiveCampaign({
        ...newCampaign,
        profile: null,
      })
    },
    [flushSave]
  )

  const updateProfile = useCallback((profile: FounderProfile) => {
    // Optimistic update
    setActiveCampaign((prev) => (prev ? { ...prev, profile } : null))

    // Store pending profile
    pendingProfileRef.current = profile

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Schedule debounced save
    saveTimeoutRef.current = setTimeout(async () => {
      const profileToSave = pendingProfileRef.current
      const campaignId = activeCampaignIdRef.current

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
        activeCampaign,
        isLoadingList,
        isLoadingCampaign,
        isSaving,
        saveError,
        extractingCampaignId,
        selectCampaign,
        createCampaign,
        updateProfile,
        refreshList,
        setExtractingCampaignId,
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
