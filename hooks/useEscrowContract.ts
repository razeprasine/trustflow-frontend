import { useCallback, useState } from 'react'
import {
  createEscrowContract,
  type Milestone,
  type MilestoneStatus,
} from '../shared/contracts-gen/escrow'
import { ESCROW_CONTRACT_ID } from '../shared/contracts'

export type { Milestone, MilestoneStatus }

interface UseEscrowContractResult {
  deposit: (gigId: Buffer, milestoneIndex: number, token: string, amount: bigint) => Promise<void>
  release: (gigId: Buffer, milestoneIndex: number) => Promise<void>
  refund: (gigId: Buffer, milestoneIndex: number) => Promise<void>
  getBalance: (gigId: Buffer, milestoneIndex: number) => Promise<bigint>
  getMilestones: (gigId: Buffer) => Promise<Milestone[]>
  isReady: boolean
  error: string | null
  clearError: () => void
}

/**
 * React hook for interacting with the escrow contract.
 *
 * Provides type-safe methods for depositing, releasing, and refunding
 * escrowed funds. All methods return typed results that are compile-time
 * checked against the contract spec.
 */
export function useEscrowContract(): UseEscrowContractResult {
  const [error, setError] = useState<string | null>(null)
  const isReady = !!ESCROW_CONTRACT_ID

  const contract = isReady ? createEscrowContract() : null

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

  const deposit = useCallback(
    (gigId: Buffer, milestoneIndex: number, token: string, amount: bigint) => {
      if (!contract) throw new Error('Escrow contract not configured')
      return withErrorHandling(() => contract.deposit(gigId, milestoneIndex, token, amount))
    },
    [contract, withErrorHandling]
  )

  const release = useCallback(
    (gigId: Buffer, milestoneIndex: number) => {
      if (!contract) throw new Error('Escrow contract not configured')
      return withErrorHandling(() => contract.release(gigId, milestoneIndex))
    },
    [contract, withErrorHandling]
  )

  const refund = useCallback(
    (gigId: Buffer, milestoneIndex: number) => {
      if (!contract) throw new Error('Escrow contract not configured')
      return withErrorHandling(() => contract.refund(gigId, milestoneIndex))
    },
    [contract, withErrorHandling]
  )

  const getBalance = useCallback(
    (gigId: Buffer, milestoneIndex: number) => {
      if (!contract) throw new Error('Escrow contract not configured')
      return withErrorHandling(() => contract.get_balance(gigId, milestoneIndex))
    },
    [contract, withErrorHandling]
  )

  const getMilestones = useCallback(
    (gigId: Buffer) => {
      if (!contract) throw new Error('Escrow contract not configured')
      return withErrorHandling(() => contract.get_gig_milestones(gigId))
    },
    [contract, withErrorHandling]
  )

  const clearError = useCallback(() => setError(null), [])

  return {
    deposit,
    release,
    refund,
    getBalance,
    getMilestones,
    isReady,
    error,
    clearError,
  }
}
