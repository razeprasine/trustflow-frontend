import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Dispute } from '../../../shared/types/dispute'

export const runtime = 'edge'

export interface DisputeDetailResponse {
  dispute: Dispute | null
  source: 'backend' | 'mock'
}

function getMockDispute(id: string): Dispute | null {
  const disputes: Dispute[] = [
    {
      id: 'dispute-001',
      title: 'Milestone delivery dispute',
      description: 'Freelancer claims full milestone payment but client says work is incomplete.',
      plaintiffAddress: 'GABCDEF1234567890ABCDEF1234567890ABCDEF1234567890',
      plaintiffName: 'Alex Freelancer',
      defendantAddress: 'GXYZ1234567890ABCDEF1234567890ABCDEF1234567890',
      defendantName: 'Bob Client',
      amount: 2500,
      status: 'active',
      evidence: [
        {
          id: 'ev-001',
          disputeId: 'dispute-001',
          submittedBy: 'GABCDEF1234567890ABCDEF1234567890ABCDEF1234567890',
          fileName: 'deliverables.zip',
          fileSize: 4_200_000,
          cid: 'QmTzQ1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1',
          mimeType: 'application/zip',
          description: 'Completed milestone deliverables',
          status: 'submitted',
          submittedAt: '2026-07-18T09:15:00.000Z',
        },
      ],
      jurors: [
        {
          walletAddress: 'GJUROR1AAAAABBBBBCCCCCDDDDDEEEEEFFFFF1111111',
          displayName: 'Juror One',
          status: 'selected',
        },
      ],
      votes: [],
      createdAt: '2026-07-15T08:00:00.000Z',
      deadline: '2026-07-25T08:00:00.000Z',
    },
    {
      id: 'dispute-002',
      title: 'Quality of work disagreement',
      description: 'Client disputes the quality of submitted design work and requests partial refund.',
      plaintiffAddress: 'GABCDEF1234567890ABCDEF1234567890ABCDEF1234567890',
      plaintiffName: 'Alex Freelancer',
      defendantAddress: 'GXYZ1234567890ABCDEF1234567890ABCDEF1234567890',
      defendantName: 'Carol Client',
      amount: 1200,
      status: 'voting',
      evidence: [
        {
          id: 'ev-002',
          disputeId: 'dispute-002',
          submittedBy: 'GABCDEF1234567890ABCDEF1234567890ABCDEF1234567890',
          fileName: 'design-mockups.pdf',
          fileSize: 1_800_000,
          cid: 'QmTzQ2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2',
          mimeType: 'application/pdf',
          description: 'Final design mockups delivered to client',
          status: 'approved',
          submittedAt: '2026-07-14T14:30:00.000Z',
        },
        {
          id: 'ev-003',
          disputeId: 'dispute-002',
          submittedBy: 'GXYZ1234567890ABCDEF1234567890ABCDEF1234567890',
          fileName: 'feedback-email.txt',
          fileSize: 4_200,
          cid: 'QmTzQ3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3',
          mimeType: 'text/plain',
          description: 'Email thread showing client feedback on deliverables',
          status: 'submitted',
          submittedAt: '2026-07-16T10:00:00.000Z',
        },
      ],
      jurors: [
        {
          walletAddress: 'GJUROR1AAAAABBBBBCCCCCDDDDDEEEEEFFFFF1111111',
          displayName: 'Juror One',
          status: 'voted',
          vote: 'plaintiff',
          votedAt: '2026-07-20T12:00:00.000Z',
        },
        {
          walletAddress: 'GJUROR2AAAAABBBBBCCCCCDDDDDEEEEEFFFFF2222222',
          displayName: 'Juror Two',
          status: 'voted',
          vote: 'defendant',
          votedAt: '2026-07-20T14:30:00.000Z',
        },
        {
          walletAddress: 'GJUROR3AAAAABBBBBCCCCCDDDDDEEEEEFFFFF3333333',
          displayName: 'Juror Three',
          status: 'selected',
        },
      ],
      votes: [
        {
          id: 'vote-001',
          disputeId: 'dispute-002',
          jurorAddress: 'GJUROR1AAAAABBBBBCCCCCDDDDDEEEEEFFFFF1111111',
          option: 'plaintiff',
          submittedAt: '2026-07-20T12:00:00.000Z',
        },
        {
          id: 'vote-002',
          disputeId: 'dispute-002',
          jurorAddress: 'GJUROR2AAAAABBBBBCCCCCDDDDDEEEEEFFFFF2222222',
          option: 'defendant',
          submittedAt: '2026-07-20T14:30:00.000Z',
        },
      ],
      createdAt: '2026-07-12T10:00:00.000Z',
      deadline: '2026-07-26T10:00:00.000Z',
    },
    {
      id: 'dispute-003',
      title: 'Late submission penalty',
      description: 'Work was submitted 3 days past deadline. Client demands full refund.',
      plaintiffAddress: 'GABCDEF1234567890ABCDEF1234567890ABCDEF1234567890',
      plaintiffName: 'Diana Freelancer',
      defendantAddress: 'GXYZ1234567890ABCDEF1234567890ABCDEF1234567890',
      defendantName: 'Eve Client',
      amount: 3000,
      status: 'resolved',
      evidence: [
        {
          id: 'ev-004',
          disputeId: 'dispute-003',
          submittedBy: 'GABCDEF1234567890ABCDEF1234567890ABCDEF1234567890',
          fileName: 'submission-timestamp.pdf',
          fileSize: 560_000,
          cid: 'QmTzQ4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4',
          mimeType: 'application/pdf',
          description: 'Proof of submission timestamp from platform',
          status: 'approved',
          submittedAt: '2026-07-10T23:59:00.000Z',
        },
      ],
      jurors: [
        {
          walletAddress: 'GJUROR1AAAAABBBBBCCCCCDDDDDEEEEEFFFFF1111111',
          displayName: 'Juror One',
          status: 'voted',
          vote: 'split',
          votedAt: '2026-07-18T09:00:00.000Z',
        },
        {
          walletAddress: 'GJUROR2AAAAABBBBBCCCCCDDDDDEEEEEFFFFF2222222',
          displayName: 'Juror Two',
          status: 'voted',
          vote: 'defendant',
          votedAt: '2026-07-18T10:30:00.000Z',
        },
      ],
      votes: [
        {
          id: 'vote-003',
          disputeId: 'dispute-003',
          jurorAddress: 'GJUROR1AAAAABBBBBCCCCCDDDDDEEEEEFFFFF1111111',
          option: 'split',
          justification: 'Both parties share responsibility for the delay.',
          submittedAt: '2026-07-18T09:00:00.000Z',
        },
        {
          id: 'vote-004',
          disputeId: 'dispute-003',
          jurorAddress: 'GJUROR2AAAAABBBBBCCCCCDDDDDEEEEEFFFFF2222222',
          option: 'defendant',
          submittedAt: '2026-07-18T10:30:00.000Z',
        },
      ],
      verdict: 'split',
      createdAt: '2026-07-05T08:00:00.000Z',
      deadline: '2026-07-19T08:00:00.000Z',
      resolvedAt: '2026-07-19T08:00:00.000Z',
    },
  ]

  return disputes.find(d => d.id === id) ?? null
}

export default async function handler(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  if (req.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const { id } = params
  const cacheHeaders = { 'Cache-Control': 's-maxage=30, stale-while-revalidate=120' }
  const backendBaseUrl = process.env.DISPUTE_API_BASE_URL

  if (!backendBaseUrl) {
    const dispute = getMockDispute(id)
    return NextResponse.json(
      { dispute, source: 'mock' } satisfies DisputeDetailResponse,
      { headers: cacheHeaders },
    )
  }

  try {
    const response = await fetch(`${backendBaseUrl}/disputes/${id}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      const dispute = getMockDispute(id)
      return NextResponse.json(
        { dispute, source: 'mock' } satisfies DisputeDetailResponse,
        { headers: cacheHeaders },
      )
    }

    const payload = (await response.json()) as Dispute
    return NextResponse.json(
      { dispute: payload, source: 'backend' } satisfies DisputeDetailResponse,
      { headers: cacheHeaders },
    )
  } catch {
    const dispute = getMockDispute(id)
    return NextResponse.json(
      { dispute, source: 'mock' } satisfies DisputeDetailResponse,
      { headers: cacheHeaders },
    )
  }
}
