import type { FounderProfile } from './profile'

export interface CampaignListItem {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export type LeadStatus = 'pending' | 'processing' | 'completed' | 'error'

export interface Lead {
  id: string
  query: string
  extraction_task_id: string | null
  verified_claims_id: string | null
  status: LeadStatus
  error: string | null
}

export interface Campaign extends CampaignListItem {
  profile: FounderProfile | null
  whoami_extraction_id: string | null
  leads: Lead[]
}
