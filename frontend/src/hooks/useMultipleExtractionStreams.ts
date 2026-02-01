import { useCallback, useEffect, useRef, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

export type LogType = 'info' | 'progress' | 'success' | 'error'

export interface LogEntry {
  type: LogType
  message: string
  timestamp: string
  progress?: number
  leadId?: string
}

export type LeadStreamStatus =
  | 'idle'
  | 'connecting'
  | 'streaming'
  | 'completed'
  | 'error'

export interface LeadStreamState {
  leadId: string
  status: LeadStreamStatus
  extractionTaskId: string
  verifiedClaimsId: string | null
  error: string | null
  progress: number
}

interface UseMultipleExtractionStreamsReturn {
  combinedLogs: LogEntry[]
  leadStates: Map<string, LeadStreamState>
  startExtraction: (leadId: string, taskId: string) => void
  resetAll: () => void
  hasActiveStreams: boolean
}

export function useMultipleExtractionStreams(): UseMultipleExtractionStreamsReturn {
  const [combinedLogs, setCombinedLogs] = useState<LogEntry[]>([])
  const [leadStates, setLeadStates] = useState<Map<string, LeadStreamState>>(
    new Map()
  )

  const eventSourcesRef = useRef<Map<string, EventSource>>(new Map())

  const startExtraction = useCallback((leadId: string, taskId: string) => {
    // Close existing connection for this lead if any
    const existing = eventSourcesRef.current.get(leadId)
    if (existing) {
      existing.close()
    }

    // Update lead state to connecting
    setLeadStates((prev) => {
      const next = new Map(prev)
      next.set(leadId, {
        leadId,
        status: 'connecting',
        extractionTaskId: taskId,
        verifiedClaimsId: null,
        error: null,
        progress: 0,
      })
      return next
    })

    const eventSource = new EventSource(
      `${API_URL}/api/extraction/${taskId}/stream`
    )
    eventSourcesRef.current.set(leadId, eventSource)

    eventSource.onopen = () => {
      setLeadStates((prev) => {
        const next = new Map(prev)
        const current = next.get(leadId)
        if (current) {
          next.set(leadId, { ...current, status: 'streaming' })
        }
        return next
      })
    }

    eventSource.addEventListener('log', (event) => {
      const data = JSON.parse(event.data) as LogEntry
      const enrichedLog = { ...data, leadId }
      setCombinedLogs((prev) => [...prev, enrichedLog])

      if (data.progress !== undefined) {
        setLeadStates((prev) => {
          const next = new Map(prev)
          const current = next.get(leadId)
          if (current) {
            next.set(leadId, { ...current, progress: data.progress! })
          }
          return next
        })
      }
    })

    eventSource.addEventListener('complete', (event) => {
      const data = JSON.parse(event.data) as { extraction_id: string }
      setLeadStates((prev) => {
        const next = new Map(prev)
        const current = next.get(leadId)
        if (current) {
          next.set(leadId, {
            ...current,
            status: 'completed',
            verifiedClaimsId: data.extraction_id,
            progress: 100,
          })
        }
        return next
      })
      eventSource.close()
      eventSourcesRef.current.delete(leadId)
    })

    eventSource.addEventListener('error', (event) => {
      if (event instanceof MessageEvent) {
        const data = JSON.parse(event.data) as { message: string }
        setLeadStates((prev) => {
          const next = new Map(prev)
          const current = next.get(leadId)
          if (current) {
            next.set(leadId, { ...current, status: 'error', error: data.message })
          }
          return next
        })
      }
      eventSource.close()
      eventSourcesRef.current.delete(leadId)
    })

    eventSource.onerror = () => {
      setLeadStates((prev) => {
        const next = new Map(prev)
        const current = next.get(leadId)
        if (current && current.status !== 'completed') {
          next.set(leadId, {
            ...current,
            status: 'error',
            error: 'Connection lost',
          })
        }
        return next
      })
      eventSource.close()
      eventSourcesRef.current.delete(leadId)
    }
  }, [])

  const resetAll = useCallback(() => {
    eventSourcesRef.current.forEach((es) => es.close())
    eventSourcesRef.current.clear()
    setCombinedLogs([])
    setLeadStates(new Map())
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      eventSourcesRef.current.forEach((es) => es.close())
    }
  }, [])

  const hasActiveStreams = Array.from(leadStates.values()).some(
    (state) => state.status === 'connecting' || state.status === 'streaming'
  )

  return { combinedLogs, leadStates, startExtraction, resetAll, hasActiveStreams }
}
