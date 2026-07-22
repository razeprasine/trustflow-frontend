import { useCallback, useEffect, useState } from 'react'
import type { Dispute } from '../shared/types/dispute'
import type { DisputeDetailResponse } from '../pages/api/disputes/[id]'

type DisputeStatus = 'idle' | 'loading' | 'success' | 'error'

interface UseDisputeResult {
  dispute: Dispute | null
  status: DisputeStatus
  error: string | null
  refetch: () => Promise<void>
}

export function useDispute(id: string | undefined): UseDisputeResult {
  const [dispute, setDispute] = useState<Dispute | null>(null)
  const [status, setStatus] = useState<DisputeStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const fetchDispute = useCallback(async () => {
    if (!id) {
      setDispute(null)
      setStatus('idle')
      return
    }

    setStatus('loading')
    setError(null)

    try {
      const response = await fetch(`/api/disputes/${encodeURIComponent(id)}`)
      if (!response.ok) {
        throw new Error(`Failed to load dispute: ${response.status}`)
      }

      const payload = (await response.json()) as DisputeDetailResponse
      setDispute(payload.dispute)
      setStatus('success')
    } catch {
      setDispute(null)
      setStatus('error')
      setError('Unable to load dispute details. Please try again.')
    }
  }, [id])

  useEffect(() => {
    fetchDispute()
  }, [fetchDispute])

  return { dispute, status, error, refetch: fetchDispute }
}
