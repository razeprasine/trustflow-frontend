import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

export interface Gig {
  id: string
  title: string
  description: string
  budgetXLM: number
  milestones: number
  category: string
  durationDays: number
  poster: string
  postedAt: string
}

export interface GigsResponse {
  items: Gig[]
  nextCursor: string | null
  total: number
  source: 'backend' | 'mock'
}

export type GigSort = 'latest' | 'budget_desc' | 'budget_asc' | 'deadline'

const CATEGORIES = ['Development', 'Design', 'Writing', 'Marketing', 'Other']
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50
const MOCK_TOTAL = 240

// Deterministic pseudo-random generator so the mock dataset (and therefore
// cursor offsets) stay stable across requests instead of reshuffling on
// every call to Math.random().
function mulberry32(seed: number) {
  return function random() {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildMockDataset(): Gig[] {
  const random = mulberry32(42)
  const titles = [
    'Smart Contract Audit for DeFi Protocol',
    'UI/UX Design for NFT Marketplace',
    'Content Writing for Blockchain Blog',
    'Landing Page Copy for Wallet Launch',
    'Soroban Contract Unit Test Suite',
    'Marketing Campaign for Token Launch',
    'Dashboard Redesign for Analytics Tool',
    'Documentation Overhaul for SDK',
    'Community Moderation for Discord',
    'Video Explainer for Escrow Flow',
  ]

  return Array.from({ length: MOCK_TOTAL }, (_, index) => {
    const category = CATEGORIES[Math.floor(random() * CATEGORIES.length)]
    const title = titles[Math.floor(random() * titles.length)]
    const daysAgo = Math.floor(random() * 60)
    const postedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()

    return {
      id: `gig-${index + 1}`,
      title: `${title} #${index + 1}`,
      description:
        'Looking for an experienced contributor to deliver high-quality, milestone-based work on the TrustFlow protocol.',
      budgetXLM: 500 + Math.floor(random() * 9500),
      milestones: 1 + Math.floor(random() * 6),
      category,
      durationDays: 3 + Math.floor(random() * 40),
      poster: `G${Math.random().toString(36).slice(2, 6).toUpperCase()}...${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      postedAt,
    }
  })
}

// Built once per module instance. Fine for mock data: it only needs to be
// stable for the lifetime of a single edge worker, not across deployments.
const MOCK_DATASET = buildMockDataset()

function applyFilters(items: Gig[], category: string | null, search: string | null): Gig[] {
  let result = items

  if (category && category !== 'All') {
    result = result.filter((gig) => gig.category === category)
  }

  if (search) {
    const query = search.trim().toLowerCase()
    if (query) {
      result = result.filter(
        (gig) =>
          gig.title.toLowerCase().includes(query) ||
          gig.description.toLowerCase().includes(query),
      )
    }
  }

  return result
}

function applySort(items: Gig[], sort: GigSort): Gig[] {
  const sorted = [...items]

  switch (sort) {
    case 'budget_desc':
      return sorted.sort((a, b) => b.budgetXLM - a.budgetXLM)
    case 'budget_asc':
      return sorted.sort((a, b) => a.budgetXLM - b.budgetXLM)
    case 'deadline':
      return sorted.sort((a, b) => a.durationDays - b.durationDays)
    case 'latest':
    default:
      return sorted.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
  }
}

function parseCursor(cursor: string | null): number {
  if (!cursor) return 0
  const offset = Number.parseInt(cursor, 10)
  return Number.isFinite(offset) && offset >= 0 ? offset : 0
}

function parseLimit(limit: string | null): number {
  const parsed = limit ? Number.parseInt(limit, 10) : DEFAULT_LIMIT
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT
  return Math.min(parsed, MAX_LIMIT)
}

function isGigSort(value: string | null): value is GigSort {
  return value === 'latest' || value === 'budget_desc' || value === 'budget_asc' || value === 'deadline'
}

function getMockGigsResponse(params: URLSearchParams): GigsResponse {
  const category = params.get('category')
  const search = params.get('search')
  const sortParam = params.get('sort')
  const sort: GigSort = isGigSort(sortParam) ? sortParam : 'latest'
  const cursorOffset = parseCursor(params.get('cursor'))
  const limit = parseLimit(params.get('limit'))

  const filtered = applySort(applyFilters(MOCK_DATASET, category, search), sort)
  const page = filtered.slice(cursorOffset, cursorOffset + limit)
  const nextOffset = cursorOffset + page.length
  const nextCursor = nextOffset < filtered.length ? String(nextOffset) : null

  return {
    items: page,
    nextCursor,
    total: filtered.length,
    source: 'mock',
  }
}

export default async function handler(req: NextRequest): Promise<NextResponse> {
  if (req.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const { searchParams } = new URL(req.url)
  const cacheHeaders = { 'Cache-Control': 's-maxage=15, stale-while-revalidate=60' }

  const backendBaseUrl = process.env.GIGS_API_BASE_URL
  if (!backendBaseUrl) {
    return NextResponse.json(getMockGigsResponse(searchParams), { headers: cacheHeaders })
  }

  try {
    const url = new URL('/gigs', backendBaseUrl)
    searchParams.forEach((value, key) => url.searchParams.set(key, value))

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      return NextResponse.json(getMockGigsResponse(searchParams), { headers: cacheHeaders })
    }

    const payload = (await response.json()) as Omit<GigsResponse, 'source'>
    return NextResponse.json({ ...payload, source: 'backend' }, { headers: cacheHeaders })
  } catch {
    return NextResponse.json(getMockGigsResponse(searchParams), { headers: cacheHeaders })
  }
}
