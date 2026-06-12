import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { Navbar } from '../../components/organisms'
import { useState } from 'react'
import { useRouter } from 'next/router'

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

const Profile: NextPage = () => {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isActive = (href: string) => router.pathname === href

  return (
    <>
      <Head>
        <title>Profile - TrustFlow</title>
        <meta name="description" content="View your reputation and work history" />
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

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile</h1>
              <p className="text-gray-600 dark:text-gray-400">Your on-chain reputation and work history</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-4xl text-white">
                    👤
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Anonymous User</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Connect wallet to load profile</p>
                  <button className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors">
                    Connect Wallet
                  </button>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Reputation Score</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Total Gigs', value: '0' },
                      { label: 'Completed', value: '0%' },
                      { label: 'Rating', value: '—' },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Work History</h3>
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-gray-600 dark:text-gray-400">No completed gigs yet</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

export default Profile
