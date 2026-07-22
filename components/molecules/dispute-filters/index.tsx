import type { DisputeStatus } from '../../../shared/types/dispute'

type RoleFilter = 'all' | 'plaintiff' | 'defendant' | 'juror'

interface DisputeFiltersProps {
  statusFilter: DisputeStatus | 'all'
  roleFilter: RoleFilter
  onStatusChange: (status: DisputeStatus | 'all') => void
  onRoleChange: (role: RoleFilter) => void
}

const STATUS_OPTIONS: { value: DisputeStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'voting', label: 'Voting' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'pending', label: 'Pending' },
  { value: 'appealed', label: 'Appealed' },
]

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'All Roles' },
  { value: 'plaintiff', label: 'As Plaintiff' },
  { value: 'defendant', label: 'As Defendant' },
  { value: 'juror', label: 'As Juror' },
]

export function DisputeFilters({
  statusFilter,
  roleFilter,
  onStatusChange,
  onRoleChange,
}: DisputeFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex flex-wrap gap-1.5">
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onStatusChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === opt.value
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <select
        value={roleFilter}
        onChange={e => onRoleChange(e.target.value as RoleFilter)}
        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 self-start"
      >
        {ROLE_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
