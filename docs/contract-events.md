# Contract event subscription layer

Implements `useContractEvents` (issue #61): a typed hook that streams
escrow/dispute Soroban contract events, dedupes across reconnects, and
hydrates the UI cache without full refetches.

## New dependency

- **`@stellar/stellar-sdk@^13.3.0`** — added to call Soroban RPC's `getEvents`.
  Pinned to v13 rather than the current latest (v16) because v14+ requires
  Node >=20, which would break the `node-version: [18, 20]` matrix in
  `.github/workflows/ci.yml`. v13.3.0 supports Node >=18 and has the same
  `rpc.Server.getEvents()` / `scValToNative` API used here. The previously
  installed `soroban-client@1.0.0-beta.2` was left untouched — it was never
  imported anywhere in the app, so nothing depends on removing it, but it's
  worth dropping in a follow-up cleanup PR since it's superseded upstream by
  `@stellar/stellar-sdk`.

## Architecture

Soroban RPC has no server-push/subscribe primitive — "streaming" means
polling `getEvents` with cursor-based pagination. Three pieces:

- **`shared/soroban-rpc.ts`** — lazily-created singleton `rpc.Server`, so
  importing it has no side effects at module load (safe for both client and
  any future server usage).
- **`shared/contract-events/store.ts`** — a module-level cache + pub/sub,
  keyed by a channel key derived from the contract IDs/topics/limits a
  caller passes in. This is the actual "UI cache hydration" mechanism:
  - Multiple components calling `useContractEvents` with the same
    `contracts`/`topics` share **one poller and one accumulated event
    list**, subscribed to via React 18's `useSyncExternalStore`. A second
    mount hydrates instantly from the shared cache instead of re-fetching.
  - **Dedup**: every event carries an RPC-assigned `id` (unique per
    ledger/tx/event index). Incoming events are merged into a `Set`/array
    keyed by `id`, so resuming from the last known cursor after a dropped
    connection never re-adds an event already in the cache.
  - **Reconnect/resume**: the channel remembers its cursor. On a retention
    error (asking for a cursor/ledger the RPC node has already pruned), it
    falls back to a fresh `startLedger` (latest ledger minus a configurable
    lookback) rather than getting stuck.
  - A channel with zero subscribers keeps its cache for 60s before eviction,
    so a quick remount (route change, React StrictMode) doesn't restart
    polling from scratch either.
  - Event storage is capped at 500 entries per channel (oldest dropped
    first) to bound memory for long-lived tabs.
- **`hooks/useContractEvents.ts`** — the public hook. Thin wrapper around
  the store via `useSyncExternalStore`; adds per-consumer "have I seen the
  latest events" state (`hasNewEvents` / `markSeen`), which is intentionally
  *not* shared across subscribers since "seen" is a per-view concern.

### Why no contract-specific event types (e.g. `DisputeOpenedEvent`)

The escrow/dispute contracts' actual event schemas live in the Soroban
contract source, which isn't in this repo. Rather than guess field shapes,
`ContractEvent.data`/`.topic` are decoded generically via `scValToNative`
and typed as `unknown`. Consumers that know the real shape (once the
contract IDL is available) should narrow it themselves, optionally with
`zod` (already a dependency, previously unused in this repo).

### Env vars

Reconciled three inconsistent naming schemes that existed across
`.env.example`, `shared/contracts.ts`, and `README.md` before this change.
Standardized on the `README.md` convention:

```
NEXT_PUBLIC_STELLAR_NETWORK=TESTNET
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_ESCROW_CONTRACT_ID=
NEXT_PUBLIC_DISPUTE_CONTRACT_ID=
```

The older `NEXT_PUBLIC_CONTRACT_ID`/`NEXT_PUBLIC_RPC_URL` exports in
`shared/contracts.ts` are kept as fallbacks, not removed, in case an
existing deployment only sets those.

### No test infrastructure

This repo has no test runner configured (no Jest/Vitest, no `*.test.ts`
files anywhere, CI only runs lint/typecheck/build). Introducing a test
runner is a bigger, separate decision, so this PR ships without unit tests
for the new store/hook, matching current repo norms — flagged here rather
than silently skipped. `docs/contract-events.md` (this file) exists to
compensate for that a little: read the "Architecture" section above before
changing `shared/contract-events/store.ts`, since the dedup/resume
invariants aren't otherwise covered by any test.

## UI

Wired into `pages/dashboard/disputes.tsx` via a new
`components/molecules/dispute-event-feed` component: a live activity feed
showing escrow/dispute events, a status dot (idle/connecting/live/error),
and a manual refresh (`resync`). Renders `null` when neither contract ID is
configured, so it's inert until a real contract is deployed.
