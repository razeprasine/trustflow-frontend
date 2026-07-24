import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

export interface PinResponse {
  cid: string
  source: 'backend' | 'mock'
}

export interface PinError {
  error: string
}

function generateMockCid(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'Qm'
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default async function handler(req: NextRequest): Promise<NextResponse> {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' } satisfies PinError, { status: 405 })
  }

  const backendBaseUrl = process.env.IPFS_API_BASE_URL

  if (!backendBaseUrl) {
    const cid = generateMockCid()
    return NextResponse.json({ cid, source: 'mock' } satisfies PinResponse, {
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file provided' } satisfies PinError, { status: 400 })
    }

    const backendFormData = new FormData()
    backendFormData.append('file', file)

    const response = await fetch(`${backendBaseUrl}/ipfs/pin`, {
      method: 'POST',
      body: backendFormData,
      signal: AbortSignal.timeout(25000),
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Backend pinning failed' } satisfies PinError, { status: 502 })
    }

    const payload = (await response.json()) as { cid: string }
    return NextResponse.json({ cid: payload.cid, source: 'backend' } satisfies PinResponse, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to pin file' } satisfies PinError, { status: 500 })
  }
}
