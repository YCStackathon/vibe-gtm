export interface ProposalMatch {
  founder_claim: string
  lead_claim: string
  source_url: string
  source_readable: string
}

export interface Proposal {
  id: string
  campaign_id: string
  lead_id: string
  lead_name: string
  score: number
  score_label: 'none' | 'low' | 'medium' | 'perfect'
  reason: string
  matches: ProposalMatch[]
  created_at: string
}
