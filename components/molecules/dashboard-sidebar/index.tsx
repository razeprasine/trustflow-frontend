import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAccount } from '../../../hooks'

interface NavItem {
  label: string
  href: string
  icon: string
  description: string
}

interface DashboardSidebarProps {
  items: NavItem[]
  open: boolean
  onClose: () => void
}

/**
 * Shared sidebar used by all dashboard sub-pages.
 *
 * Renders navigation links and a connected-wallet info card at the bottom
 * driven by the Freighter `useAccount` hook.
 */
export function DashboardSidebar({ items, open, onClose }: DashboardSidebarProps) {
  const router = useRouter()
  const account = useAccount()

  const isActive = (href: string) => router.pathname === href

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <nav className="p-4 space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
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
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Connected Wallet
            </div>
            {account ? (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate">
                  {account.displayName}
                </span>
              </div>
            ) : (
              <div className="text-sm text-gray-400 dark:text-gray-500 italic">
                Not connected
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
