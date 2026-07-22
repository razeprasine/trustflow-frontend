import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Navbar } from '../../../components/organisms'
import { Courtroom } from '../../../components/organisms/courtroom'
import { useDispute } from '../../../hooks'

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

const DisputeDetail: NextPage = () => {
  const router = useRouter()
  const { id } = router.query
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { dispute, status, error, refetch } = useDispute(typeof id === 'string' ? id : undefined)
  const isActive = (href: string) => router.pathname.startsWith(href)

  return (
    <>
      <Head>
        <title>{dispute ? `${dispute.title} - TrustFlow` : 'Dispute - TrustFlow'}</title>
        <meta name="description" content="Dispute resolution courtroom" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />

        <div className="flex">
          {sidebarOpen && (
            <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          <aside className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <nav className="p-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive(item.href) ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{item.description}</div>
                  </div>
                </Link>
              ))}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Connected Wallet</div>
                <div className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate">Not connected</div>
              </div>
            </div>
          </aside>

          <main className="flex-1 p-6 lg:p-8">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden mb-4 p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800" aria-label="Toggle menu">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="mb-6">
              <Link href="/dashboard/disputes" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to disputes
              </Link>
            </div>

            {status === 'loading' && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8" />
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            )}

            {status === 'error' && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
                <div className="text-5xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to load dispute</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Unable to load dispute details.'}</p>
                <div className="flex justify-center gap-3">
                  <button onClick={refetch} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
                    Try again
                  </button>
                  <Link href="/dashboard/disputes" className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    Back to disputes
                  </Link>
                </div>
              </div>
            )}

            {status === 'success' && !dispute && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Dispute not found</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">The dispute you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                <Link href="/dashboard/disputes" className="inline-flex px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
                  Back to disputes
                </Link>
              </div>
            )}

            {status === 'success' && dispute && <Courtroom dispute={dispute} />}
          </main>
        </div>
      </div>
    </>
  )
}

export default DisputeDetail
