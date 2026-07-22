/**
 * Which TrustFlow contract emitted an event. Determined by matching the
 * event's contractId against shared/contracts.ts, not by guessing topic
 * names, since the exact event schema lives in the Soroban contract source
 * (not in this frontend repo).
 */
export type ContractEventSource = 'escrow' | 'dispute'

/**
 * Typed event data for escrow contract events.
 * Import from shared/contracts-gen for full type safety.
 */
export interface EscrowEvent {
  deposited: {
    milestone_index: number
    token: string
    amount: bigint
    depositor: string
  }
  released: {
    milestone_index: number
    freelancer: string
    amount: bigint
  }
  refunded: {
    milestone_index: number
    client: string
    amount: bigint
  }
}

/**
 * Typed event data for dispute contract events.
 * Import from shared/contracts-gen for full type safety.
 */
export interface DisputeEvent {
  dispute_opened: {
    dispute_id: Uint8Array
    opener: string
    reason: string
  }
  evidence_submitted: {
    submitter: string
    evidence_uri: string
  }
  vote_cast: {
    voter: string
    in_favor: boolean
  }
  dispute_resolved: {
    outcome: string
    votes_for: number
    votes_against: number
  }
}

export type TypedContractEvent =
  | { source: 'escrow'; type: keyof EscrowEvent; data: EscrowEvent[keyof EscrowEvent] }
  | { source: 'dispute'; type: keyof DisputeEvent; data: DisputeEvent[keyof DisputeEvent] }

export interface ContractEvent {
  /** Unique + monotonically increasing per contract, used for dedup and as the resume cursor. */
  id: string
  source: ContractEventSource
  contractId: string
  ledger: number
  ledgerClosedAt: string
  txHash: string
  /** Decoded topic segments (e.g. ["dispute_opened", "<gig-id>"]), native JS values. */
  topic: unknown[]
  /** Decoded event body, native JS value. Shape depends on the emitting contract function. */
  data: unknown
}

export type ContractEventsStatus = 'idle' | 'connecting' | 'live' | 'error'

export interface ContractEventsSnapshot {
  events: ContractEvent[]
  status: ContractEventsStatus
  error: string | null
  /** Cursor to resume from on the next poll; persisted across reconnects to avoid full refetches. */
  cursor: string | null
}
