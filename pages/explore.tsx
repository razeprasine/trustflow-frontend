import { useEffect, useMemo, useRef, useState } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Navbar } from '../components/organisms'
import { useDebouncedValue, useGigsExplorer } from '../hooks'
import type { GigSort } from './api/gigs'

const CATEGORIES = ['All', 'Development', 'Design', 'Writing', 'Marketing', 'Other']

const SORT_OPTIONS: { label: string; value: GigSort }[] = [
  { label: 'Latest', value: 'latest' },
  { label: 'Budget: High to Low', value: 'budget_desc' },
  { label: 'Budget: Low to High', value: 'budget_asc' },
  { label: 'Deadline', value: 'deadline' },
]

const LIST_HEIGHT_PX = 720
const ROW_HEIGHT_PX = 190
const LOAD_MORE_THRESHOLD = 4

function isGigSort(value: unknown): value is GigSort {
  return value === 'latest' || value === 'budget_desc' || value === 'budget_asc' || value === 'deadline'
}

function readQueryParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

const Explore: NextPage = () => {
  const router = useRouter()

  // Filters are only meaningful once we've read the initial values out of
  // the URL (router.query is empty on the very first render). Everything
  // downstream waits on `hydrated` so we never briefly show/fetch the
  // defaults and then jump to the real URL-driven state.
  const [hydrated, setHydrated] = useState(false)
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState<GigSort>('latest')
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    if (!router.isReady || hydrated) return

    const queryCategory = readQueryParam(router.query.category)
    const querySort = readQueryParam(router.query.sort)
    const querySearch = readQueryParam(router.query.q)

    if (CATEGORIES.includes(queryCategory)) setCategory(queryCategory)
    if (isGigSort(querySort)) setSort(querySort)
    if (querySearch) setSearchInput(querySearch)

    setHydrated(true)
    // Only run this once, right after the router has the real query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, hydrated])

  const debouncedSearch = useDebouncedValue(searchInput, 300)

  // Keep the URL in sync with filter state so refresh and back/forward
  // restore exactly what the user had selected. Shallow + replace: this is
  // filter state, not new pages, so it shouldn't spam browser history.
  useEffect(() => {
    if (!hydrated) return

    const query: Record<string, string> = {}
    if (category !== 'All') query.category = category
    if (sort !== 'latest') query.sort = sort
    if (debouncedSearch.trim()) query.q = debouncedSearch.trim()

    router.replace({ pathname: '/explore', query }, undefined, { shallow: true })
    // router is stable across renders in Next's pages router; omitting it
    // avoids re-running this on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, category, sort, debouncedSearch])

  const filters = useMemo(
    () => ({ category, search: debouncedSearch, sort }),
    [category, debouncedSearch, sort],
  )

  const { items, status, error, hasMore, total, fetchNextPage } = useGigsExplorer(filters)

  const scrollParentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: 6,
  })

  const virtualItems = virtualizer.getVirtualItems()

  // Infinite scroll: once the windowed list has rendered close to the end
  // of what we've loaded, ask for the next cursor page.
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1]
    if (!lastItem) return
    if (lastItem.index >= items.length - LOAD_MORE_THRESHOLD && hasMore && status !== 'loading' && status !== 'loadingMore') {
      fetchNextPage()
    }
  }, [virtualItems, items.length, hasMore, status, fetchNextPage])

  const isInitialLoading = status === 'loading' && items.length === 0

  return (
    <>
      <Head>
        <title>Explore Gigs - TrustFlow</title>
        <meta name="description" content="Browse available gigs and find work on TrustFlow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />

        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Explore Gigs
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Browse available work and connect with clients on the decentralized marketplace
            </p>
          </div>

          {/* Search and filters */}
          <div className="mb-6 space-y-4">
            {/* Search bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search gigs..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filters row */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Categories */}
              <div className="flex-1 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`
                      px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors
                      ${
                        category === c
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500'
                      }
                    `}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Sort dropdown */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as GigSort)}
                className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            {isInitialLoading ? 'Loading gigs…' : `${total} ${total === 1 ? 'gig' : 'gigs'} found`}
          </div>

          {status === 'error' && (
            <div className="mb-4 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {!isInitialLoading && items.length === 0 ? (
            /* Empty state */
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No gigs found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Try adjusting your filters or search terms
              </p>
              <button
                onClick={() => {
                  setCategory('All')
                  setSearchInput('')
                }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            /* Virtualized, infinite-scrolling gig list */
            <div
              ref={scrollParentRef}
              style={{ height: LIST_HEIGHT_PX, overflowY: 'auto' }}
              className="rounded-xl"
            >
              <div
                style={{
                  height: virtualizer.getTotalSize(),
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualItems.map((virtualRow) => {
                  const gig = items[virtualRow.index]
                  if (!gig) return null

                  return (
                    <div
                      key={gig.id}
                      data-index={virtualRow.index}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: virtualRow.size,
                        transform: `translateY(${virtualRow.start}px)`,
                        paddingBottom: '1rem',
                      }}
                    >
                      <div className="h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200 group flex flex-col justify-between">
                        <div>
                          {/* Category badge */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium">
                              {gig.category}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(gig.postedAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                            {gig.title}
                          </h3>

                          {/* Description */}
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {gig.description}
                          </p>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
                          <div className="flex gap-6">
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Budget</div>
                              <div className="font-bold text-gray-900 dark:text-white">{gig.budgetXLM.toLocaleString()} XLM</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Duration</div>
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{gig.durationDays} days</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Milestones</div>
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{gig.milestones}</div>
                            </div>
                          </div>
                          <Link
                            href={`/gig/${gig.id}`}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {status === 'loadingMore' && (
                <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Loading more gigs…
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  )
}

export default Explore
