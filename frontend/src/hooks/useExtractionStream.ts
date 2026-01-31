import { useCallback, useEffect, useRef, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

export type LogType = 'info' | 'progress' | 'success' | 'error'

export interface LogEntry {
  type: LogType
  message: string
  timestamp: string
  progress?: number
}

export interface ExtractionStreamState {
  logs: LogEntry[]
  status: 'idle' | 'connecting' | 'streaming' | 'completed' | 'error'
  extractionId: string | null
  error: string | null
  progress: number
}

export function useExtractionStream(taskId: string | null) {
  const [state, setState] = useState<ExtractionStreamState>({
    logs: [],
    status: 'idle',
    extractionId: null,
    error: null,
    progress: 0,
  })

  const eventSourceRef = useRef<EventSource | null>(null)

  const connect = useCallback(() => {
    if (!taskId) return

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    setState((prev) => ({ ...prev, status: 'connecting', logs: [], error: null }))

    const eventSource = new EventSource(`${API_URL}/api/extraction/${taskId}/stream`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setState((prev) => ({ ...prev, status: 'streaming' }))
    }

    eventSource.addEventListener('log', (event) => {
      const data = JSON.parse(event.data) as LogEntry
      setState((prev) => ({
        ...prev,
        logs: [...prev.logs, data],
        progress: data.progress ?? prev.progress,
      }))
    })

    eventSource.addEventListener('complete', (event) => {
      const data = JSON.parse(event.data) as { extraction_id: string }
      setState((prev) => ({
        ...prev,
        status: 'completed',
        extractionId: data.extraction_id,
        progress: 100,
      }))
      eventSource.close()
    })

    eventSource.addEventListener('error', (event) => {
      // Check if it's an SSE error event with data
      if (event instanceof MessageEvent) {
        const data = JSON.parse(event.data) as { message: string }
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: data.message,
        }))
      }
      eventSource.close()
    })

    eventSource.onerror = () => {
      // Connection error - only set error if not already completed
      setState((prev) => {
        if (prev.status === 'completed') return prev
        return {
          ...prev,
          status: 'error',
          error: 'Connection lost',
        }
      })
      eventSource.close()
    }
  }, [taskId])

  // Auto-connect when taskId changes
  useEffect(() => {
    if (taskId) {
      connect()
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [taskId, connect])

  const reset = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    setState({
      logs: [],
      status: 'idle',
      extractionId: null,
      error: null,
      progress: 0,
    })
  }, [])

  return { ...state, reset }
}
