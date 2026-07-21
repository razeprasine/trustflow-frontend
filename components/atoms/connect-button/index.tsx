import { useState } from 'react'
import { setAllowed } from '@stellar/freighter-api'
import styles from './style.module.css'

export interface ConnectButtonProps {
  label: string
  isHigher?: boolean
  /** Called after a successful setAllowed + wallet connection is detected */
  onConnect?: () => void
}

/**
 * Renders a "Connect Wallet" button that triggers the Freighter permission flow.
 *
 * - Shows a loading spinner while the connection is in progress
 * - Displays inline error text if the connection fails
 * - Fires `onConnect` so parents can refresh state after a successful connect
 */
export function ConnectButton({ label, isHigher, onConnect }: ConnectButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      await setAllowed()
      onConnect?.()
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to connect wallet'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <button
        className={`${styles.button} ${loading ? styles.loading : ''}`}
        style={{ height: isHigher ? 50 : 38, minWidth: isHigher ? 240 : undefined }}
        onClick={handleClick}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : null}
        <span>{loading ? 'Connecting…' : label}</span>
      </button>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
