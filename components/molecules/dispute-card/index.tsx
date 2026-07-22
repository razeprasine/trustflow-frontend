import Link from 'next/link'
import type { Dispute, DisputeStatus } from '../../../shared/types/dispute'

interface DisputeCardProps {
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

function getRemainingTime(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `${days}d ${hours}h left`
  return `${hours}h left`
}

export function DisputeCard({ dispute }: DisputeCardProps) {
  return (
    <Link href={`/dashboard/disputes/${dispute.id}`} className="block">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 mr-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {dispute.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {dispute.description}
            </p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[dispute.status]}`}>
            {STATUS_LABELS[dispute.status]}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
            <span className="font-medium text-gray-900 dark:text-gray-100">{dispute.plaintiffName}</span>
            <span className="text-gray-400 dark:text-gray-500">vs</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{dispute.defendantName}</span>
          </div>

          <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">|</span>

          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{dispute.amount.toLocaleString()} USDC</span>
          </div>

          <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">|</span>

          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{getRemainingTime(dispute.deadline)}</span>
          </div>
        </div>

        {dispute.jurors.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{dispute.jurors.length} juror{dispute.jurors.length !== 1 ? 's' : ''} assigned</span>
              {dispute.votes.length > 0 && (
                <span className="text-gray-400">· {dispute.votes.length} vote{dispute.votes.length !== 1 ? 's' : ''} cast</span>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
