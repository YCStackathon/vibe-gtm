import type { ProfileExtractionResponse } from '../types/profile'

const API_URL = import.meta.env.VITE_API_URL || ''

export async function extractProfile(
  file: File,
  campaignId: string
): Promise<ProfileExtractionResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('campaign_id', campaignId)

  const response = await fetch(`${API_URL}/api/identity/extract`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || 'Failed to extract profile')
  }

  return response.json()
}
