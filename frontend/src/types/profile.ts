export interface Education {
  institution: string | null
  degree: string | null
  field_of_study: string | null
  start_year: number | null
  end_year: number | null
}

export interface Experience {
  company: string | null
  title: string | null
  description: string | null
  start_year: number | null
  end_year: number | null
}

export interface SocialUrls {
  linkedin: string | null
  twitter: string | null
  github: string | null
  instagram: string | null
  facebook: string | null
  website: string | null
}

export interface FounderProfile {
  name: string | null
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  current_job_title: string | null
  email: string | null
  phone: string | null
  location: string | null
  summary: string | null
  skills: string[]
  education: Education[]
  experience: Experience[]
  social_urls: SocialUrls
}

export interface ProfileExtractionResponse {
  profile: FounderProfile
  citations?: Record<string, unknown>
  extraction_task_id?: string
}
