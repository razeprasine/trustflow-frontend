import moment from 'moment'
import { useContractEvents } from '../../../hooks'
import { DISPUTE_CONTRACT_ID, ESCROW_CONTRACT_ID } from '../../../shared/contracts'
import type { ContractEvent, EscrowEvent, DisputeEvent } from '../../../shared/contract-events/types'

function eventTitle(event: ContractEvent): string {
  const topLevel = event.topic[0]
  return typeof topLevel === 'string' ? topLevel : `${event.source} event`
}

function formatEventData(event: ContractEvent): string {
  if (!event.data || typeof event.data !== 'object') return ''

  const data = event.data as Record<string, unknown>

  if (event.source === 'escrow') {
    if ('amount' in data) return `${data.amount} tokens`
    if ('freelancer' in data) return `to ${data.freelancer}`
  }
  if (event.source === 'dispute') {
    if ('reason' in data) return String(data.reason)
    if ('evidence_uri' in data) return String(data.evidence_uri)
    if ('outcome' in data) return String(data.outcome)
  }
  return ''
}

function truncate(value: string, size = 6): string {
  return value.length > size * 2 ? `${value.slice(0, size)}…${value.slice(-size)}` : value
}

function StatusDot({ isLive, hasError }: { isLive: boolean; hasError: boolean }) {
  const color = hasError ? 'bg-red-500' : isLive ? 'bg-green-500' : 'bg-gray-400'
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} aria-hidden />
}

/**
 * Live feed of escrow/dispute contract events, backed by `useContractEvents`.
 * Renders nothing if neither contract ID is configured (see .env.example).
 */
export function DisputeEventFeed() {
  const { events, status, error, isLive, hasNewEvents, markSeen, resync } = useContractEvents({
    contracts: { escrow: ESCROW_CONTRACT_ID, dispute: DISPUTE_CONTRACT_ID },
  })

  if (!ESCROW_CONTRACT_ID && !DISPUTE_CONTRACT_ID) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <StatusDot isLive={isLive} hasError={status === 'error'} />
          <h3 className="font-semibold text-gray-900 dark:text-white">Live activity</h3>
          {hasNewEvents && (
            <button
              onClick={markSeen}
              className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
            >
              New
            </button>
          )}
        </div>
        <button
          onClick={resync}
          className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          Refresh
        </button>
      </div>

      {error && (
        <p className="px-4 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40">{error}</p>
      )}

      {events.length === 0 ? (
        <p className="p-6 text-sm text-gray-500 dark:text-gray-400">
          {status === 'connecting' ? 'Connecting to the network…' : 'No recent escrow or dispute activity yet.'}
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-800 max-h-96 overflow-y-auto">
          {[...events].reverse().map(event => (
            <li key={event.id} className="p-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-white capitalize">{eventTitle(event)}</p>
                {formatEventData(event) && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{formatEventData(event)}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="uppercase">{event.source}</span> · ledger {event.ledger} · tx {truncate(event.txHash)}
                </p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">{moment(event.ledgerClosedAt).fromNow()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
