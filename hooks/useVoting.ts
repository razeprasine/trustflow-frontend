import { useState, useCallback } from 'react'
import type { VoteOption } from '../shared/types/dispute'

type VoteSubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

interface UseVotingResult {
  submitStatus: VoteSubmitStatus
  submitError: string | null
  submitVote: (disputeId: string, option: VoteOption, justification?: string) => Promise<boolean>
  reset: () => void
}

export function useVoting(): UseVotingResult {
  const [submitStatus, setSubmitStatus] = useState<VoteSubmitStatus>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const submitVote = useCallback(
    async (disputeId: string, option: VoteOption, justification?: string): Promise<boolean> => {
      setSubmitStatus('submitting')
      setSubmitError(null)

      try {
        const response = await fetch(`/api/disputes/${encodeURIComponent(disputeId)}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ option, justification }),
        })

        if (!response.ok) {
          throw new Error(`Vote submission failed: ${response.status}`)
        }

        setSubmitStatus('success')
        return true
      } catch (err) {
        setSubmitStatus('error')
        setSubmitError(err instanceof Error ? err.message : 'Failed to submit vote')
        return false
      }
    },
    [],
  )

  const reset = useCallback(() => {
    setSubmitStatus('idle')
    setSubmitError(null)
  }, [])

  return { submitStatus, submitError, submitVote, reset }
}
