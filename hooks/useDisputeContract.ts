import { useCallback, useState } from 'react'
import {
  createDisputeContract,
  type Dispute,
  type DisputeOutcome,
  type DisputeStatus,
} from '../shared/contracts-gen/dispute'
import { DISPUTE_CONTRACT_ID } from '../shared/contracts'

export type { Dispute, DisputeOutcome, DisputeStatus }

interface UseDisputeContractResult {
  openDispute: (gigId: Buffer, milestoneIndex: number, reason: string) => Promise<void>
  submitEvidence: (disputeId: Buffer, evidenceUri: string) => Promise<void>
  vote: (disputeId: Buffer, inFavor: boolean) => Promise<void>
  resolve: (disputeId: Buffer) => Promise<DisputeOutcome>
  getDispute: (disputeId: Buffer) => Promise<Dispute>
  isReady: boolean
  error: string | null
  clearError: () => void
}

/**
 * React hook for interacting with the dispute contract.
 *
 * Provides type-safe methods for opening disputes, submitting evidence,
 * voting, and resolving disputes. All methods return typed results that
 * are compile-time checked against the contract spec.
 */
export function useDisputeContract(): UseDisputeContractResult {
  const [error, setError] = useState<string | null>(null)
  const isReady = !!DISPUTE_CONTRACT_ID

  const contract = isReady ? createDisputeContract() : null

  const withErrorHandling = useCallback(
    <T,>(fn: () => Promise<T>): Promise<T> => {
      setError(null)
      return fn().catch((err) => {
        const message = err instanceof Error ? err.message : 'Contract call failed'
        setError(message)
        throw err
      })
    },
    []
  )

  const openDispute = useCallback(
    (gigId: Buffer, milestoneIndex: number, reason: string) => {
      if (!contract) throw new Error('Dispute contract not configured')
      return withErrorHandling(() => contract.open_dispute(gigId, milestoneIndex, reason))
    },
    [contract, withErrorHandling]
  )

  const submitEvidence = useCallback(
    (disputeId: Buffer, evidenceUri: string) => {
      if (!contract) throw new Error('Dispute contract not configured')
      return withErrorHandling(() => contract.submit_evidence(disputeId, evidenceUri))
    },
    [contract, withErrorHandling]
  )

  const vote = useCallback(
    (disputeId: Buffer, inFavor: boolean) => {
      if (!contract) throw new Error('Dispute contract not configured')
      return withErrorHandling(() => contract.vote(disputeId, inFavor))
    },
    [contract, withErrorHandling]
  )

  const resolve = useCallback(
    (disputeId: Buffer) => {
      if (!contract) throw new Error('Dispute contract not configured')
      return withErrorHandling(() => contract.resolve(disputeId))
    },
    [contract, withErrorHandling]
  )

  const getDispute = useCallback(
    (disputeId: Buffer) => {
      if (!contract) throw new Error('Dispute contract not configured')
      return withErrorHandling(() => contract.get_dispute(disputeId))
    },
    [contract, withErrorHandling]
  )

  const clearError = useCallback(() => setError(null), [])

  return {
    openDispute,
    submitEvidence,
    vote,
    resolve,
    getDispute,
    isReady,
    error,
    clearError,
  }
}
