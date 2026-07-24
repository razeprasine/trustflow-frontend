import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { Navbar } from '../../components/organisms'
import { DisputeCard, DisputeFilters } from '../../components/molecules'
import { useDisputes } from '../../hooks'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import type { DisputeStatus } from '../../shared/types/dispute'
import { DashboardSidebar, DisputeEventFeed } from '../../components/molecules'


interface NavItem {
  label: string
  href: string
  icon: string
  description: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'My Gigs', href: '/dashboard', icon: '💼', description: 'View and manage your active gigs' },
  { label: 'Disputes', href: '/dashboard/disputes', icon: '⚖️', description: 'Active dispute resolutions' },
  { label: 'Profile', href: '/dashboard/profile', icon: '👤', description: 'Your reputation and work history' },
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙️', description: 'Account and preferences' },
]

type RoleFilter = 'all' | 'plaintiff' | 'defendant' | 'juror'

const Disputes: NextPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | 'all'>('all')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const { disputes, status, error, refetch } = useDisputes()
  const isActive = (href: string) => router.pathname === href

  const filteredDisputes = useMemo(() => {
    return disputes.filter(d => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false
      if (roleFilter === 'plaintiff') return false
      if (roleFilter === 'defendant') return false
      if (roleFilter === 'juror') return d.jurors.length > 0
      return true
    })
  }, [disputes, statusFilter, roleFilter])

  const stats = useMemo(() => ({
    total: disputes.length,
    active: disputes.filter(d => d.status === 'active').length,
    voting: disputes.filter(d => d.status === 'voting').length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
  }), [disputes])

  return (
    <>
      <Head>
        <title>Disputes - TrustFlow</title>
        <meta name="description" content="View and manage your active disputes" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />

        <div className="flex">
          <DashboardSidebar
            items={NAV_ITEMS}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <main className="flex-1 p-6 lg:p-8">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden mb-4 p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800" aria-label="Toggle menu">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Disputes</h1>
              <p className="text-gray-600 dark:text-gray-400">Track and manage active dispute resolutions</p>
            </div>

            {status === 'error' && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                </div>
                <button onClick={refetch} className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline">
                  Retry
                </button>
              </div>
            )}

            {disputes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                  <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Active</div>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                  <div className="text-2xl font-bold text-purple-600">{stats.voting}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Voting</div>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                  <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Resolved</div>
                </div>
              </div>
            )}

            {status === 'loading' && (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 animate-pulse">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
                    <div className="flex gap-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {status === 'success' && disputes.length > 0 && (
              <>
                <div className="mb-6">
                  <DisputeFilters
                    statusFilter={statusFilter}
                    roleFilter={roleFilter}
                    onStatusChange={setStatusFilter}
                    onRoleChange={setRoleFilter}
                  />
                </div>

                <div className="space-y-4">
                  {filteredDisputes.length > 0 ? (
                    filteredDisputes.map(d => (
                      <DisputeCard key={d.id} dispute={d} />
                    ))
                  ) : (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
                      <div className="text-5xl mb-4">🔍</div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No matching disputes</h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        No disputes match your current filters. Try adjusting the status or role filter.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {status === 'success' && disputes.length === 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
                <div className="text-6xl mb-4">⚖️</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No disputes yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  When you raise a dispute or get selected as a juror, you&apos;ll see them here with evidence and voting options.
                </p>
              </div>
            )}
            <div className="mb-6">
              <DisputeEventFeed />
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">⚖️</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No active disputes</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                When you raise a dispute or get selected as a juror, you&apos;ll see them here with evidence and voting options.
              </p>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

export default Disputes
