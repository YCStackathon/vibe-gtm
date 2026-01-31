import type { Campaign, CampaignListItem } from '../types/campaign'
import type { FounderProfile } from '../types/profile'

const API_URL = import.meta.env.VITE_API_URL || ''

export async function listCampaigns(): Promise<CampaignListItem[]> {
  const response = await fetch(`${API_URL}/api/campaigns`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || 'Failed to list campaigns')
  }

  return response.json()
}

export async function createCampaign(name: string): Promise<CampaignListItem> {
  const response = await fetch(`${API_URL}/api/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || 'Failed to create campaign')
  }

  return response.json()
}

export async function getCampaign(id: string): Promise<Campaign> {
  const response = await fetch(`${API_URL}/api/campaigns/${id}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || 'Failed to get campaign')
  }

  return response.json()
}

export async function updateCampaignProfile(
  id: string,
  profile: FounderProfile
): Promise<void> {
  const response = await fetch(`${API_URL}/api/campaigns/${id}/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || 'Failed to update campaign profile')
  }
}
