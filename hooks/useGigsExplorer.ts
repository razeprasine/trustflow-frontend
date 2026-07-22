import { useCallback, useEffect, useRef, useState } from 'react'
import type { Gig, GigSort } from '../pages/api/gigs'

type GigsStatus = 'idle' | 'loading' | 'loadingMore' | 'success' | 'error'

export interface GigsFilters {
  category: string
  search: string
  sort: GigSort
}

interface UseGigsExplorerResult {
  items: Gig[]
  status: GigsStatus
  error: string | null
  hasMore: boolean
  total: number
  fetchNextPage: () => void
}

function buildQuery(filters: GigsFilters, cursor: string | null): string {
  const params = new URLSearchParams()
  if (filters.category && filters.category !== 'All') {
    params.set('category', filters.category)
  }
  if (filters.search.trim()) {
    params.set('search', filters.search.trim())
  }
  params.set('sort', filters.sort)
  if (cursor) {
    params.set('cursor', cursor)
  }
  return params.toString()
}

/**
 * Cursor-based, server-driven gig listing.
 *
 * Filters are owned by the caller (typically synced to the URL) and passed
 * in as a stable-ish object; changing any of them resets pagination and
 * refetches from the first page. `fetchNextPage` appends the next cursor's
 * worth of results for infinite scroll.
 */
export function useGigsExplorer(filters: GigsFilters): UseGigsExplorerResult {
  const [items, setItems] = useState<Gig[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState<GigsStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  // Guards against out-of-order responses when filters change quickly
  // (e.g. fast typing in search) by ignoring stale requests.
  const requestIdRef = useRef(0)

  const loadPage = useCallback(
    async (targetCursor: string | null, mode: 'replace' | 'append') => {
      const requestId = ++requestIdRef.current
      setStatus(mode === 'replace' ? 'loading' : 'loadingMore')
      setError(null)

      try {
        const query = buildQuery(filters, targetCursor)
        const response = await fetch(`/api/gigs?${query}`)
        if (!response.ok) {
          throw new Error(`Failed to load gigs: ${response.status}`)
        }
        const payload = (await response.json()) as {
          items: Gig[]
          nextCursor: string | null
          total: number
        }

        if (requestId !== requestIdRef.current) {
          // A newer request has already started; drop this stale response.
          return
        }

        setItems((prev) => (mode === 'replace' ? payload.items : [...prev, ...payload.items]))
        setCursor(payload.nextCursor)
        setHasMore(payload.nextCursor !== null)
        setTotal(payload.total)
        setStatus('success')
      } catch {
        if (requestId !== requestIdRef.current) return
        setStatus('error')
        setError('Unable to load gigs right now. Please try again.')
      }
    },
    // filters is intentionally the trigger for a full reset; see the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters.category, filters.search, filters.sort],
  )

  useEffect(() => {
    setItems([])
    setCursor(null)
    setHasMore(true)
    loadPage(null, 'replace')
    // Re-run whenever the filters meaningfully change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.search, filters.sort])

  const fetchNextPage = useCallback(() => {
    if (status === 'loading' || status === 'loadingMore' || !hasMore) {
      return
    }
    loadPage(cursor, 'append')
  }, [cursor, hasMore, loadPage, status])

  return { items, status, error, hasMore, total, fetchNextPage }
}
