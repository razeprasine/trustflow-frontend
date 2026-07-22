import React, { useEffect, useState } from 'react'
import { Spacer } from '../../atoms/spacer'
import { Utils } from '../../../shared/utils'
import { useEscrowContract } from '../../../hooks'

export interface IDepositsProps {
  address: string
  decimals: number
  gigId?: Buffer
  milestoneIndex?: number
  name?: string
  symbol?: string
}

/**
 * Deposits — shows the user's escrowed balance.
 *
 * Fetches real balance from the escrow contract when configured.
 * Falls back to zero if contract is not available.
 */
export function Deposits(props: IDepositsProps) {
  const [balance, setBalance] = useState<bigint>(BigInt(0))
  const escrow = useEscrowContract()

  useEffect(() => {
    if (!escrow.isReady || !props.gigId || props.milestoneIndex === undefined) return

    escrow.getBalance(props.gigId, props.milestoneIndex).then(setBalance).catch(() => {})
  }, [escrow, props.gigId, props.milestoneIndex])

  if (Number(balance) <= 0) {
    return <React.Fragment />
  }

  return (
    <>
      <Spacer rem={2} />
      <h6>You&apos;ve Deposited</h6>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
          {Utils.formatAmount(balance, props.decimals)}{' '}
          <span title={props.name}>{props.symbol}</span>
        </span>
      </div>
    </>
  )
}
