import { useState, useRef, useEffect } from 'react'
import { setAllowed } from '@stellar/freighter-api'

interface WalletButtonProps {
  address: string
  /** The Stellar network name, e.g. "Test SDF Network ; September 2015" */
  network?: string | null
  /** Called when the user clicks "Disconnect" in the dropdown */
  onDisconnect: () => void
  /** Label for the switch-account menu item */
  switchAccountLabel?: string
  /** Label for the disconnect menu item */
  disconnectLabel?: string
}

/**
 * Shows the connected wallet address and a dropdown with:
 * - Current network indicator
 * - Switch account (re-opens Freighter permission popup)
 * - Disconnect (clears local connection state)
 *
 * Clicking outside closes the dropdown.
 */
export function WalletButton({
  address,
  network,
  onDisconnect,
  switchAccountLabel = 'Switch account',
  disconnectLabel = 'Disconnect',
}: WalletButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayName = `${address.slice(0, 4)}...${address.slice(-4)}`

  // Derive a short, human-readable network label
  const networkLabel = deriveNetworkLabel(network)

  function handleSwap() {
    setOpen(false)
    // Re-invoking setAllowed opens the Freighter permission popup so the user
    // can approve a different profile without disconnecting first.
    void setAllowed()
  }

  function handleDisconnect() {
    setOpen(false)
    onDisconnect()
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        {/* Connection indicator */}
        <span
          className="w-2 h-2 rounded-full bg-green-500"
          aria-hidden="true"
          title="Connected"
        />
        {displayName}
        {/* Chevron */}
        <svg
          className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-56 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1 z-50"
        >
          {/* Network badge */}
          {networkLabel && (
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {networkLabel}
                </span>
              </div>
            </div>
          )}

          <button
            role="menuitem"
            onClick={handleSwap}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {switchAccountLabel}
          </button>

          <button
            role="menuitem"
            onClick={handleDisconnect}
            className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {disconnectLabel}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────

/** Derive a short display label from the network passphrase or name. */
function deriveNetworkLabel(
  network: string | null | undefined,
): string | null {
  if (!network) return null
  if (network.includes('Test')) return 'Testnet'
  if (network.includes('Future')) return 'Futurenet'
  if (network.includes('Public')) return 'Mainnet'
  // Fallback: return the first segment
  return network.split(';')[0]?.trim() || network
}
