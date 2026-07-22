import type { Vote, Juror } from '../../../shared/types/dispute'

interface VoteTallyProps {
  votes: Vote[]
  jurors: Juror[]
  totalJurors: number
}

export function VoteTally({ votes, jurors, totalJurors }: VoteTallyProps) {
  const plaintiffVotes = votes.filter(v => v.option === 'plaintiff').length
  const defendantVotes = votes.filter(v => v.option === 'defendant').length
  const splitVotes = votes.filter(v => v.option === 'split').length
  const totalVotes = votes.length
  const remaining = totalJurors - totalVotes

  const getPercentage = (count: number) => {
    if (totalVotes === 0) return 0
    return Math.round((count / totalVotes) * 100)
  }

  const plaintiffPct = getPercentage(plaintiffVotes)
  const defendantPct = getPercentage(defendantVotes)
  const splitPct = getPercentage(splitVotes)

  const bars = [
    { label: 'Plaintiff', count: plaintiffVotes, pct: plaintiffPct, color: 'bg-blue-500' },
    { label: 'Defendant', count: defendantVotes, pct: defendantPct, color: 'bg-red-500' },
    { label: 'Split', count: splitVotes, pct: splitPct, color: 'bg-purple-500' },
  ]

  const maxPct = Math.max(plaintiffPct, defendantPct, splitPct, 1)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          {totalVotes} of {totalJurors} jurors have voted
        </span>
        {remaining > 0 && (
          <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
            {remaining} remaining
          </span>
        )}
      </div>

      <div className="space-y-2">
        {bars.map(bar => (
          <div key={bar.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300 font-medium">{bar.label}</span>
              <span className="text-gray-500 dark:text-gray-400">
                {bar.count} ({bar.pct}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${bar.color}`}
                style={{ width: `${(bar.pct / maxPct) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        {jurors.map(juror => (
          <div
            key={juror.walletAddress}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              juror.status === 'voted'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {juror.displayName}
          </div>
        ))}
      </div>
    </div>
  )
}
