import { useState } from 'react'
import { TransactionModal } from '../transaction-modal'
import { useVoting } from '../../../hooks'
import type { VoteOption } from '../../../shared/types/dispute'

const VOTE_OPTIONS: { value: VoteOption; label: string; description: string }[] = [
  {
    value: 'plaintiff',
    label: 'For Plaintiff',
    description: 'The plaintiff (freelancer) should receive the full amount',
  },
  {
    value: 'defendant',
    label: 'For Defendant',
    description: 'The defendant (client) should not pay the disputed amount',
  },
  {
    value: 'split',
    label: 'Split Decision',
    description: 'Both parties share responsibility — funds split proportionally',
  },
]

interface JurorVotePanelProps {
  disputeId: string
  hasVoted: boolean
  currentVote?: VoteOption
  onVoteSubmitted?: () => void
}

export function JurorVotePanel({ disputeId, hasVoted, currentVote, onVoteSubmitted }: JurorVotePanelProps) {
  const [selectedOption, setSelectedOption] = useState<VoteOption | null>(null)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const { submitStatus, submitError, submitVote, reset } = useVoting()

  const canSubmit = selectedOption !== null && hasReviewed && submitStatus !== 'submitting'

  const handleSubmit = async () => {
    if (!selectedOption) return

    setShowConfirmModal(true)
    const success = await submitVote(disputeId, selectedOption)

    if (success) {
      onVoteSubmitted?.()
    }
  }

  const handleCloseModal = () => {
    setShowConfirmModal(false)
    reset()
  }

  if (hasVoted) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Vote Cast</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          You voted in favor of{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {currentVote === 'plaintiff' ? 'the Plaintiff' : currentVote === 'defendant' ? 'the Defendant' : 'a Split Decision'}
          </span>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Your vote has been recorded on-chain. Results will be revealed when voting concludes.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {VOTE_OPTIONS.map(opt => (
          <label
            key={opt.value}
            className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedOption === opt.value
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/50'
            }`}
          >
            <input
              type="radio"
              name="vote-option"
              value={opt.value}
              checked={selectedOption === opt.value}
              onChange={() => setSelectedOption(opt.value)}
              className="sr-only"
            />
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                selectedOption === opt.value
                  ? 'border-indigo-500 bg-indigo-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {selectedOption === opt.value && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div>
                <div className={`text-sm font-semibold ${
                  selectedOption === opt.value
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {opt.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {opt.description}
                </div>
              </div>
            </div>
          </label>
        ))}
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={hasReviewed}
          onChange={e => setHasReviewed(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          I have carefully reviewed all evidence submitted by both parties before casting my vote.
        </span>
      </label>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full py-3 rounded-lg text-sm font-semibold transition-all ${
          canSubmit
            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
        }`}
      >
        {submitStatus === 'submitting' ? 'Submitting Vote…' : 'Cast Vote'}
      </button>

      {submitStatus === 'error' && submitError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        </div>
      )}

      {showConfirmModal && (
        <TransactionModal
          result={{
            status: submitStatus === 'success' ? 'success' : 'error',
            value: selectedOption ?? undefined,
            error: submitError ?? undefined,
          }}
          closeModal={handleCloseModal}
        />
      )}
    </div>
  )
}
