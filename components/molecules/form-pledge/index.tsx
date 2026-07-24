import React, { FunctionComponent, useState } from 'react'
import { AmountInput, Button, Checkbox } from '../../atoms'
import { TransactionModal } from '../../molecules/transaction-modal'
import { Utils } from '../../../shared/utils'
import { useEscrowContract } from '../../../hooks'
import styles from './style.module.css'
import { Spacer } from '../../atoms/spacer'

export interface IFormPledgeProps {
  account: string
  decimals: number
  symbol?: string
  gigId?: Buffer
  milestoneIndex?: number
  onPledge: () => void
  updatedAt: number
}

export interface IResultSubmit {
  status: string
  value?: string
  symbol?: string
  error?: string
}

/**
 * FormPledge — escrow deposit form.
 *
 * Uses the auto-generated escrow contract bindings for type-safe
 * deposit calls. Falls back to simulated delay if contract is not
 * configured.
 */
const FormPledge: FunctionComponent<IFormPledgeProps> = props => {
  const [balance] = React.useState<BigInt>(BigInt(0))
  const [decimals] = React.useState<number>(props.decimals)
  const [symbol] = React.useState<string>(props.symbol ?? 'XLM')

  const [amount, setAmount] = useState<number>()
  const [resultSubmit, setResultSubmit] = useState<IResultSubmit | undefined>()
  const [input, setInput] = useState('')
  const [isSubmitting, setSubmitting] = useState(false)

  const escrow = useEscrowContract()

  const clearInput = (): void => {
    setInput('')
  }

  const handleSubmit = async (): Promise<void> => {
    if (!amount) return
    setSubmitting(true)
    try {
      if (escrow.isReady && props.gigId && props.milestoneIndex !== undefined) {
        const amountBigInt = BigInt(Math.floor(amount * 10 ** decimals))
        await escrow.deposit(props.gigId, props.milestoneIndex, props.symbol ?? 'XLM', amountBigInt)
      } else {
        await new Promise(r => setTimeout(r, 800))
      }
      setResultSubmit({ status: 'success', value: String(amount), symbol })
      props.onPledge()
      setInput('')
      setAmount(undefined)
    } catch (e) {
      setResultSubmit({
        status: 'error',
        error: e instanceof Error ? e.message : 'An error has occurred',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h6>Choose Amount</h6>
      <div className={styles.wrapper}>
        {[100, 250, 500, 1000].map(v => (
          <Checkbox
            key={v}
            title={`${v} ${props.symbol}`}
            value={v}
            isChecked={amount === v}
            setAmount={setAmount}
            clearInput={clearInput}
          />
        ))}
      </div>
      <div className={styles.centerContent}>
        <h6>OR</h6>
      </div>
      <AmountInput
        placeHolder="Custom amount"
        setAmount={setAmount}
        input={input}
        setInput={setInput}
      />
      <Button
        title="Deposit to Escrow"
        onClick={handleSubmit}
        disabled={!amount || isSubmitting}
        isLoading={isSubmitting}
      />
      {props.account && props.decimals && props.symbol ? (
        <div>
          <Spacer rem={1} />
          <div className={styles.wrapper}>
            <div>
              <h6>Your balance: {Utils.formatAmount(balance, decimals)} {symbol}</h6>
            </div>
          </div>
        </div>
      ) : null}
      {resultSubmit && (
        <TransactionModal
          result={resultSubmit}
          closeModal={() => setResultSubmit(undefined)}
        />
      )}
    </div>
  )
}

export { FormPledge }
