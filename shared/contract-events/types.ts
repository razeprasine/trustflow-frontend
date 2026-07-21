/**
 * Which TrustFlow contract emitted an event. Determined by matching the
 * event's contractId against shared/contracts.ts, not by guessing topic
 * names, since the exact event schema lives in the Soroban contract source
 * (not in this frontend repo).
 */
export type ContractEventSource = 'escrow' | 'dispute'

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
