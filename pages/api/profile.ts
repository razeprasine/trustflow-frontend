import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

export interface ProfileGig {
  id: string
  title: string
  client: string
  completedAt: string
  payoutUSDC: number
  rating: number
}

export interface ProfileReputation {
  score: number
  totalGigs: number
  completionRate: number
  averageRating: number
}

export interface UserProfileResponse {
  walletAddress: string
  displayName: string
  bio: string
  reputation: ProfileReputation
  pastGigs: ProfileGig[]
  source: 'backend' | 'mock'
}

interface BackendProfileResponse {
  walletAddress: string
  displayName: string
  bio: string
  reputation: ProfileReputation
  pastGigs: ProfileGig[]
}

function getMockProfile(walletAddress: string): UserProfileResponse {
  return {
    walletAddress,
    displayName: 'Freelancer',
    bio: 'Product-focused freelancer helping teams ship reliable web3 experiences with clear delivery milestones.',
    reputation: {
      score: 92,
      totalGigs: 5,
      completionRate: 100,
      averageRating: 4.8,
    },
    pastGigs: [
      {
        id: 'gig-001',
        title: 'Smart Contract Integration for Milestone Escrow',
        client: 'Nova Labs',
        completedAt: '2026-05-17T09:30:00.000Z',
        payoutUSDC: 1200,
        rating: 5,
      },
      {
        id: 'gig-002',
        title: 'Responsive Dashboard UI Refactor',
        client: 'Acme Studio',
        completedAt: '2026-04-06T14:20:00.000Z',
        payoutUSDC: 850,
        rating: 4.6,
      },
      {
        id: 'gig-003',
        title: 'Dispute Evidence Upload Flow',
        client: 'Orbit Works',
        completedAt: '2026-02-26T11:10:00.000Z',
        payoutUSDC: 640,
        rating: 4.9,
      },
    ],
    source: 'mock',
  }
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}

function normalizeBackendResponse(payload: BackendProfileResponse): UserProfileResponse {
  return {
    walletAddress: payload.walletAddress,
    displayName: payload.displayName,
    bio: payload.bio,
    reputation: {
      score: parseNumber(payload.reputation?.score),
      totalGigs: parseNumber(payload.reputation?.totalGigs),
      completionRate: parseNumber(payload.reputation?.completionRate),
      averageRating: parseNumber(payload.reputation?.averageRating),
    },
    pastGigs: (payload.pastGigs ?? []).map(gig => ({
      id: gig.id,
      title: gig.title,
      client: gig.client,
      completedAt: gig.completedAt,
      payoutUSDC: parseNumber(gig.payoutUSDC),
      rating: parseNumber(gig.rating),
    })),
    source: 'backend',
  }
}

export default async function handler(req: NextRequest): Promise<NextResponse> {
  if (req.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const { searchParams } = new URL(req.url)
  const walletAddress = searchParams.get('walletAddress')?.trim() || 'unknown'

  const cacheHeaders = { 'Cache-Control': 's-maxage=30, stale-while-revalidate=120' }

  const backendBaseUrl = process.env.PROFILE_API_BASE_URL
  if (!backendBaseUrl) {
    return NextResponse.json(getMockProfile(walletAddress), { headers: cacheHeaders })
  }

  try {
    const url = new URL('/profiles', backendBaseUrl)
    url.searchParams.set('walletAddress', walletAddress)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      return NextResponse.json(getMockProfile(walletAddress), { headers: cacheHeaders })
    }

    const payload = (await response.json()) as BackendProfileResponse
    return NextResponse.json(normalizeBackendResponse(payload), { headers: cacheHeaders })
  } catch {
    return NextResponse.json(getMockProfile(walletAddress), { headers: cacheHeaders })
  }
}