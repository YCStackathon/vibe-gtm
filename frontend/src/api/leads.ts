const API_URL = import.meta.env.VITE_API_URL || ''

export interface ParseLeadsResponse {
  queries: string[]
}

export async function parseLeads(rawText: string): Promise<ParseLeadsResponse> {
  const response = await fetch(`${API_URL}/api/leads/parse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw_text: rawText }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || 'Failed to parse leads')
  }

  return response.json()
}
