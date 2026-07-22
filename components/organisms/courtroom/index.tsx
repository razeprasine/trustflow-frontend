import type { Dispute, DisputeStatus } from '../../../shared/types/dispute'
import { EvidenceViewer, EvidenceSubmission, JurorVotePanel, VoteTally } from '../../molecules'

interface CourtroomProps {
  dispute: Dispute
}

const STATUS_LABELS: Record<DisputeStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  voting: 'Voting',
  resolved: 'Resolved',
  appealed: 'Appealed',
}

const STATUS_COLORS: Record<DisputeStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  voting: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  appealed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

const STATUS_BG: Record<DisputeStatus, string> = {
  pending: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900',
  active: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900',
  voting: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900',
  resolved: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900',
  appealed: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900',
}

function getRemainingTime(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `${days}d ${hours}h remaining`
  return `${hours}h remaining`
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function PartyCard({
  label,
  name,
  address,
}: {
  label: string
  name: string
  address: string
}) {
  return (
    <div className="flex-1 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
        {label}
      </div>
      <div className="text-base font-semibold text-gray-900 dark:text-white mb-1">{name}</div>
      <div className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate" title={address}>
        {address.slice(0, 8)}…{address.slice(-6)}
      </div>
    </div>
  )
}

export function Courtroom({ dispute }: CourtroomProps) {
  const votedJurors = dispute.jurors.filter(j => j.status === 'voted')
  const selectedJurors = dispute.jurors.filter(j => j.status === 'selected')

  return (
    <div className="space-y-6">
      <div className={`rounded-xl border p-6 ${STATUS_BG[dispute.status]}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {dispute.title}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[dispute.status]}`}>
                {STATUS_LABELS[dispute.status]}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Case #{dispute.id} · Created {new Date(dispute.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`text-lg font-bold ${dispute.status === 'resolved' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
              {dispute.amount.toLocaleString()} USDC
            </div>
            {dispute.status !== 'resolved' && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {getRemainingTime(dispute.deadline)}
              </div>
            )}
            {dispute.resolvedAt && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Resolved {new Date(dispute.resolvedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <PartyCard label="Plaintiff" name={dispute.plaintiffName} address={dispute.plaintiffAddress} />
        <div className="flex items-center justify-center text-2xl text-gray-400 dark:text-gray-600 flex-shrink-0">
          ⚖️
        </div>
        <PartyCard label="Defendant" name={dispute.defendantName} address={dispute.defendantAddress} />
      </div>

      <Section title={`Evidence (${dispute.evidence.length})`}>
        <EvidenceViewer evidence={dispute.evidence} />
      </Section>

      {(dispute.status === 'active' || dispute.status === 'pending') && (
        <Section title="Submit Evidence">
          <EvidenceSubmission
            disputeId={dispute.id}
            onEvidenceSubmitted={(ev) => {
              console.log('Evidence submitted:', ev)
            }}
          />
        </Section>
      )}

      {dispute.jurors.length > 0 && (
        <Section title={`Jurors (${dispute.jurors.length})`}>
          <div className="space-y-3">
            {dispute.jurors.map(juror => (
              <div key={juror.walletAddress} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    {juror.displayName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {juror.displayName}
                    </div>
                    <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      {juror.walletAddress.slice(0, 8)}…{juror.walletAddress.slice(-6)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {juror.status === 'voted' ? (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      Voted {juror.vote && `— ${juror.vote.charAt(0).toUpperCase() + juror.vote.slice(1)}`}
                    </span>
                  ) : juror.status === 'dismissed' ? (
                    <span className="text-sm text-red-500">Dismissed</span>
                  ) : (
                    <span className="text-sm text-yellow-600 dark:text-yellow-400">Pending vote</span>
                  )}
                  {juror.votedAt && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {new Date(juror.votedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">{votedJurors.length}</span>
              of <span className="font-medium text-gray-900 dark:text-white">{dispute.jurors.length}</span>
              {' '}jurors have voted
            </div>
          </div>
        </Section>
      )}

      {dispute.verdict && (
        <Section title="Verdict">
          <div className="text-center py-4">
            <div className="text-4xl mb-3">
              {dispute.verdict === 'plaintiff' ? '👤' : dispute.verdict === 'defendant' ? '👤' : '⚖️'}
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {dispute.verdict === 'plaintiff' && `In favor of ${dispute.plaintiffName}`}
              {dispute.verdict === 'defendant' && `In favor of ${dispute.defendantName}`}
              {dispute.verdict === 'split' && 'Split decision'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {dispute.verdict === 'split'
                ? 'Funds will be distributed proportionally based on juror votes.'
                : 'The ruling has been finalized and will be executed on-chain.'}
            </div>
          </div>
        </Section>
      )}

      {dispute.status === 'voting' && selectedJurors.length > 0 && (
        <Section title="Your Vote">
          <JurorVotePanel
            disputeId={dispute.id}
            hasVoted={false}
          />
        </Section>
      )}

      {(dispute.status === 'voting' || dispute.status === 'resolved') && dispute.votes.length > 0 && (
        <Section title="Vote Tally">
          <VoteTally
            votes={dispute.votes}
            jurors={dispute.jurors}
            totalJurors={dispute.jurors.length}
          />
        </Section>
      )}
    </div>
  )
}
