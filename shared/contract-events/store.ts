import { rpc, scValToNative } from '@stellar/stellar-sdk'
import { getSorobanServer } from '../soroban-rpc'
import type { ContractEvent, ContractEventSource, ContractEventsSnapshot, ContractEventsStatus } from './types'

/**
 * Module-level event cache/pub-sub, keyed by channel (contract set + topic
 * filter + polling config). This is what lets `useContractEvents` "hydrate
 * the UI cache without full refetches": every mount for the same channel
 * shares one poller and one accumulated event list via useSyncExternalStore,
 * instead of each component instance re-fetching from scratch.
 *
 * Soroban RPC has no server push/subscribe primitive, so "streaming" here
 * means polling `getEvents` with cursor-based pagination. Events are
 * deduped by their RPC-assigned `id` (unique per ledger+tx+event index), so
 * resuming from the last cursor after a dropped connection never re-adds an
 * event already in the cache.
 */

export interface ChannelContractConfig {
  source: ContractEventSource
  contractId: string
}

export interface ChannelOptions {
  contracts: ChannelContractConfig[]
  /** Raw base64-XDR topic filter segments (advanced use), passed through to Soroban RPC as-is. */
  topics?: string[][]
  pollIntervalMs: number
  limit: number
  /** How far back (in ledgers) to look on the very first poll, before a cursor exists. */
  initialLookbackLedgers: number
}

interface Channel {
  options: ChannelOptions
  snapshot: ContractEventsSnapshot
  events: ContractEvent[]
  eventIds: Set<string>
  cursor: string | null
  startLedger: number | null
  listeners: Set<() => void>
  pollTimer: ReturnType<typeof setTimeout> | null
  evictionTimer: ReturnType<typeof setTimeout> | null
}

const MAX_EVENTS = 500
const CHANNEL_EVICTION_DELAY_MS = 60_000

const channels = new Map<string, Channel>()

const EMPTY_SNAPSHOT: ContractEventsSnapshot = { status: 'idle', events: [], error: null, cursor: null }

export function buildChannelKey(options: ChannelOptions): string {
  const contractsKey = [...options.contracts]
    .sort((a, b) => a.contractId.localeCompare(b.contractId))
    .map(c => `${c.source}:${c.contractId}`)
    .join(',')
  const topicsKey = options.topics ? JSON.stringify(options.topics) : ''
  return `${contractsKey}|${topicsKey}|${options.limit}|${options.initialLookbackLedgers}`
}

function createSnapshot(
  status: ContractEventsStatus,
  events: ContractEvent[],
  error: string | null,
  cursor: string | null
): ContractEventsSnapshot {
  return { status, events, error, cursor }
}

function getOrCreateChannel(key: string, options: ChannelOptions): Channel {
  let channel = channels.get(key)
  if (!channel) {
    channel = {
      options,
      snapshot: EMPTY_SNAPSHOT,
      events: [],
      eventIds: new Set(),
      cursor: null,
      startLedger: null,
      listeners: new Set(),
      pollTimer: null,
      evictionTimer: null,
    }
    channels.set(key, channel)
  }
  return channel
}

function notify(channel: Channel): void {
  for (const listener of channel.listeners) listener()
}

export function subscribe(key: string, options: ChannelOptions, listener: () => void): () => void {
  const channel = getOrCreateChannel(key, options)
  channel.listeners.add(listener)

  if (channel.evictionTimer) {
    clearTimeout(channel.evictionTimer)
    channel.evictionTimer = null
  }

  if (channel.listeners.size === 1 && !channel.pollTimer) {
    void runPollLoop(key)
  }

  return () => {
    channel.listeners.delete(listener)
    if (channel.listeners.size === 0 && !channel.evictionTimer) {
      if (channel.pollTimer) {
        clearTimeout(channel.pollTimer)
        channel.pollTimer = null
      }
      // Keep the cache around briefly so a quick remount (route change, StrictMode)
      // hydrates instantly instead of re-polling from scratch.
      channel.evictionTimer = setTimeout(() => channels.delete(key), CHANNEL_EVICTION_DELAY_MS)
    }
  }
}

export function getSnapshot(key: string): ContractEventsSnapshot {
  const channel = channels.get(key)
  return channel ? channel.snapshot : EMPTY_SNAPSHOT
}

export function getServerSnapshot(): ContractEventsSnapshot {
  return EMPTY_SNAPSHOT
}

export function resync(key: string): void {
  const channel = channels.get(key)
  if (!channel) return

  channel.events = []
  channel.eventIds.clear()
  channel.cursor = null
  channel.startLedger = null
  channel.snapshot = createSnapshot('connecting', channel.events, null, null)
  notify(channel)

  if (channel.pollTimer) {
    clearTimeout(channel.pollTimer)
    channel.pollTimer = null
  }
  if (channel.listeners.size > 0) {
    void runPollLoop(key)
  }
}

function extractContractId(event: rpc.Api.EventResponse): string | null {
  return event.contractId ? event.contractId.contractId() : null
}

/** Soroban RPC rejects `startLedger`/`cursor` values outside its retention window with an error string, not a typed error. */
function isRetentionError(message: string): boolean {
  return /startLedger|ledger range|oldest ledger|is before/i.test(message)
}

async function runPollLoop(key: string): Promise<void> {
  const channel = channels.get(key)
  if (!channel) return

  try {
    const server = getSorobanServer()

    if (!channel.cursor && channel.startLedger === null) {
      channel.snapshot = createSnapshot('connecting', channel.events, null, channel.cursor)
      notify(channel)
      const latest = await server.getLatestLedger()
      channel.startLedger = Math.max(1, latest.sequence - channel.options.initialLookbackLedgers)
    }

    const filters = channel.options.contracts.map(contract => ({
      contractIds: [contract.contractId],
      ...(channel.options.topics ? { topics: channel.options.topics } : {}),
    }))

    const request: rpc.Server.GetEventsRequest = channel.cursor
      ? { filters, cursor: channel.cursor, limit: channel.options.limit }
      : { filters, startLedger: channel.startLedger ?? 1, limit: channel.options.limit }

    const response = await server.getEvents(request)

    let changed = false
    for (const raw of response.events) {
      if (channel.eventIds.has(raw.id)) continue

      const contractId = extractContractId(raw)
      const contractMeta = channel.options.contracts.find(c => c.contractId === contractId)
      if (!contractMeta) continue

      channel.eventIds.add(raw.id)
      channel.events.push({
        id: raw.id,
        source: contractMeta.source,
        contractId: contractMeta.contractId,
        ledger: raw.ledger,
        ledgerClosedAt: raw.ledgerClosedAt,
        txHash: raw.txHash,
        topic: raw.topic.map(scValToNative),
        data: scValToNative(raw.value),
      })
      changed = true
    }

    if (channel.events.length > MAX_EVENTS) {
      const removed = channel.events.splice(0, channel.events.length - MAX_EVENTS)
      for (const removedEvent of removed) channel.eventIds.delete(removedEvent.id)
    }

    channel.cursor = response.cursor

    if (changed || channel.snapshot.status !== 'live' || channel.snapshot.error) {
      channel.snapshot = createSnapshot('live', channel.events, null, channel.cursor)
      notify(channel)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch contract events'
    if (isRetentionError(message)) {
      channel.cursor = null
      channel.startLedger = null
    }
    channel.snapshot = createSnapshot('error', channel.events, message, channel.cursor)
    notify(channel)
  } finally {
    if (channel.listeners.size > 0) {
      channel.pollTimer = setTimeout(() => void runPollLoop(key), channel.options.pollIntervalMs)
    } else {
      channel.pollTimer = null
    }
  }
}
