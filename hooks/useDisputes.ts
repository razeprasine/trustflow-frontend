import { useCallback, useEffect, useState } from 'react'
import type { Dispute } from '../shared/types/dispute'
import type { DisputesListResponse } from '../pages/api/disputes/index'

type DisputesStatus = 'idle' | 'loading' | 'success' | 'error'

interface UseDisputesResult {
  disputes: Dispute[]
  status: DisputesStatus
  error: string | null
  refetch: () => Promise<void>
}

export function useDisputes(): UseDisputesResult {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [status, setStatus] = useState<DisputesStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const fetchDisputes = useCallback(async () => {
    setStatus('loading')
    setError(null)

    try {
      const response = await fetch('/api/disputes')
      if (!response.ok) {
        throw new Error(`Failed to load disputes: ${response.status}`)
      }

      const payload = (await response.json()) as DisputesListResponse
      setDisputes(payload.disputes)
      setStatus('success')
    } catch {
      setDisputes([])
      setStatus('error')
      setError('Unable to load disputes. Please try again.')
    }
  }, [])

  useEffect(() => {
    fetchDisputes()
  }, [fetchDisputes])

  return { disputes, status, error, refetch: fetchDisputes }
}
