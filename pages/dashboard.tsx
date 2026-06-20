import { useState } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Navbar } from '../components/organisms'
import { USDCConverter, FileUpload } from '../components/molecules'
import type { UploadedFile } from '../components/molecules'
import { useUSDCPrice, formatUSD, convertToUSD } from '../hooks/useUSDCPrice'

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

// Placeholder escrow balance in USDC for demo purposes
const ESCROW_USDC = 0

const Dashboard: NextPage = () => {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { price: usdcPrice, status: priceStatus } = useUSDCPrice()

  const isActive = (href: string) => router.pathname === href

  const escrowUSD =
    usdcPrice !== null ? formatUSD(convertToUSD(ESCROW_USDC, usdcPrice)) : null

  function handleUploadComplete(entry: UploadedFile) {
    // TODO: persist the CID on-chain via the TrustFlow milestone release contract
    console.log('Deliverable pinned to IPFS:', entry.cid, entry.file.name)
  }

  function handleUploadError(entry: UploadedFile) {
    console.error('IPFS pin failed for', entry.file.name, entry.error)
  }

  return (
    <>
      <Head>
        <title>Dashboard - TrustFlow</title>
        <meta name="description" content="Manage your gigs, disputes, and profile on TrustFlow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />

        <div className="flex">
          {/* Mobile sidebar backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            className={`
              fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 transition-transform duration-300
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
          >
            <nav className="p-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors group
                    ${
                      isActive(item.href)
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                      {item.description}
                    </div>
                  </div>
                </Link>
              ))}
            </nav>

            {/* Wallet info section */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Connected Wallet</div>
                <div className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate">
                  Not connected
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-6 lg:p-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden mb-4 p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Dashboard header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Gigs</h1>
              <p className="text-gray-600 dark:text-gray-400">View and manage your active and completed gigs</p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Active Gigs */}
              <div className="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">💼</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    Active
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Gigs</div>
              </div>

              {/* In Escrow — with live USD equivalent */}
              <div className="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">🔒</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                    Active
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                  {ESCROW_USDC} USDC
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {priceStatus === 'loading' && escrowUSD === null
                    ? 'Loading…'
                    : escrowUSD !== null
                    ? `≈ ${escrowUSD}`
                    : '—'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">In Escrow</div>
              </div>

              {/* Completed */}
              <div className="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">✓</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
                    Active
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
              </div>

              {/* Disputes */}
              <div className="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">⚖️</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                    Active
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Disputes</div>
              </div>
            </div>

            {/* USDC → USD Converter widget */}
            <div className="mb-8 max-w-md">
              <USDCConverter />
            </div>

            {/* Deliverables upload — for freelancers to submit work for IPFS pinning */}
            <div className="mb-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Submit Deliverables
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Upload your work files. Each file is pinned to IPFS and its content identifier (CID) is
                  recorded on-chain when you release a milestone.
                </p>
              </div>
              <FileUpload
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                multiple={true}
                maxFileSizeBytes={50 * 1024 * 1024}
              />
            </div>

            {/* Empty state */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">💼</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No gigs yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Connect your wallet and start accepting gigs to see them here. Your escrow milestones will be tracked automatically.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/explore"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Browse Gigs
                </Link>
                <button
                  className="px-6 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

export default Dashboard
