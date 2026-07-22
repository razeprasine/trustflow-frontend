import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import {
  buildChannelKey,
  getServerSnapshot,
  getSnapshot,
  resync as resyncChannel,
  subscribe,
  type ChannelContractConfig,
  type ChannelOptions,
} from '../shared/contract-events/store'
import type { ContractEvent, ContractEventSource, ContractEventsSnapshot, ContractEventsStatus } from '../shared/contract-events/types'

export type { ContractEvent, ContractEventSource, ContractEventsStatus }

export interface UseContractEventsOptions {
  /** Contract IDs to stream events from, keyed by which TrustFlow contract they belong to. Falsy values are skipped. */
  contracts: Partial<Record<ContractEventSource, string | null | undefined>>
  /** Raw base64-XDR topic filter segments, forwarded to Soroban RPC's getEvents as-is. Omit to receive all topics. */
  topics?: string[][]
  /** How often to poll Soroban RPC for new events, in ms. Default 6000. */
  pollIntervalMs?: number
  /** Max events per RPC page. Default 50. */
  limit?: number
  /** Ledgers to look back on the very first poll, before a cursor exists. Default 100 (~8 min at 5s/ledger). */
  initialLookbackLedgers?: number
  /** Set to false to pause polling without tearing down the accumulated cache. Default true. */
  enabled?: boolean
}

export interface UseContractEventsResult {
  /** Deduplicated events accumulated since the channel was created, oldest first. */
  events: ContractEvent[]
  status: ContractEventsStatus
  error: string | null
  /** True once at least one successful poll has completed. */
  isLive: boolean
  /** True if events have arrived since the last `markSeen()` call. */
  hasNewEvents: boolean
  /** Marks all currently accumulated events as seen (e.g. when the user opens the feed). */
  markSeen: () => void
  /** Drops the accumulated cache and cursor, then reconnects from a fresh ledger lookback. */
  resync: () => void
}

const DEFAULT_POLL_INTERVAL_MS = 6_000
const DEFAULT_LIMIT = 50
const DEFAULT_LOOKBACK_LEDGERS = 100

const IDLE_SNAPSHOT: ContractEventsSnapshot = { status: 'idle', events: [], error: null, cursor: null }

/**
 * Streams escrow/dispute contract events from Soroban RPC.
 *
 * Soroban RPC has no push/subscribe primitive, so this polls `getEvents` with
 * cursor-based pagination under the hood. Multiple components calling this
 * hook with the same `contracts`/`topics` share a single poller and a single
 * accumulated event cache (see shared/contract-events/store.ts), so mounting
 * it in several places hydrates instantly from cache instead of re-fetching.
 * Events are deduped by their RPC-assigned id, so a dropped connection that
 * resumes from the last cursor never produces duplicate entries.
 */
export function useContractEvents(options: UseContractEventsOptions): UseContractEventsResult {
  const {
    contracts,
    topics,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    limit = DEFAULT_LIMIT,
    initialLookbackLedgers = DEFAULT_LOOKBACK_LEDGERS,
    enabled = true,
  } = options

  const escrowContractId = contracts.escrow
  const disputeContractId = contracts.dispute

  const contractsList = useMemo<ChannelContractConfig[]>(() => {
    const list: ChannelContractConfig[] = []
    if (escrowContractId) list.push({ source: 'escrow', contractId: escrowContractId })
    if (disputeContractId) list.push({ source: 'dispute', contractId: disputeContractId })
    return list
  }, [escrowContractId, disputeContractId])

  const channelOptions = useMemo<ChannelOptions>(
    () => ({ contracts: contractsList, topics, pollIntervalMs, limit, initialLookbackLedgers }),
    [contractsList, topics, pollIntervalMs, limit, initialLookbackLedgers]
  )

  const channelKey = useMemo(() => buildChannelKey(channelOptions), [channelOptions])
  const isActive = enabled && contractsList.length > 0

  const subscribeFn = useCallback(
    (listener: () => void) => (isActive ? subscribe(channelKey, channelOptions, listener) : () => {}),
    [isActive, channelKey, channelOptions]
  )
  const getSnapshotFn = useCallback(() => (isActive ? getSnapshot(channelKey) : IDLE_SNAPSHOT), [isActive, channelKey])

  const snapshot = useSyncExternalStore(subscribeFn, getSnapshotFn, getServerSnapshot)

  const [seenCount, setSeenCount] = useState(0)
  const markSeen = useCallback(() => setSeenCount(snapshot.events.length), [snapshot.events.length])

  const resync = useCallback(() => resyncChannel(channelKey), [channelKey])

  return {
    events: snapshot.events,
    status: snapshot.status,
    error: snapshot.error,
    isLive: snapshot.status === 'live',
    hasNewEvents: snapshot.events.length > seenCount,
    markSeen,
    resync,
  }
}
