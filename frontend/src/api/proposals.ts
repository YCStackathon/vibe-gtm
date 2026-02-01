import type { Proposal } from '../types/proposal'

const API_URL = import.meta.env.VITE_API_URL || ''

export async function listProposals(campaignId: string): Promise<Proposal[]> {
  const response = await fetch(`${API_URL}/api/proposals/${campaignId}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || 'Failed to fetch proposals')
  }

  const data = await response.json()
  return data.proposals
}
