import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { Navbar } from '../../components/organisms'
import { DashboardSidebar, DisputeEventFeed } from '../../components/molecules'
import { useState } from 'react'

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

const Disputes: NextPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
