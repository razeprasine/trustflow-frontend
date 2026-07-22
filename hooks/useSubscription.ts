import * as React from 'react'

/**
 * Placeholder subscription hook.
 *
 * @deprecated Superseded by `useContractEvents`, which implements real Soroban
 * RPC event polling with dedup and cache hydration. Kept for back-compat with
 * any existing callers; prefer `useContractEvents` for new code.
 */
export function useSubscription(
  _contractId: string,
  _topic: string,
  _onEvent: (event: unknown) => void,
  _pollInterval = 5000
) {
  React.useEffect(() => {
    // TODO: implement Soroban event polling via @stellar/stellar-sdk
  }, [_contractId, _topic, _onEvent, _pollInterval])
}
