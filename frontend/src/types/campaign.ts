import type { FounderProfile } from './profile'

export interface CampaignListItem {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Campaign extends CampaignListItem {
  profile: FounderProfile | null
}
