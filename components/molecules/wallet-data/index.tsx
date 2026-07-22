import React from 'react'
import { useWallet, useIsMounted } from '../../../hooks'
import { ConnectButton } from '../../atoms'
import styles from './style.module.css'

/**
 * Displays connected wallet address and network or a connect button.
 *
 * Uses `useWallet` so it picks up network and connection state automatically.
 */
export function WalletData() {
  const mounted = useIsMounted()
  const { account, connect } = useWallet()

  if (!mounted) {
    return <ConnectButton label="Connect Wallet" />
  }

  return (
    <>
      {account ? (
        <div className={styles.displayData}>
          <div className={styles.card}>{account.displayName}</div>
        </div>
      ) : (
        <ConnectButton label="Connect Wallet" onConnect={connect} />
      )}
    </>
  )
}
