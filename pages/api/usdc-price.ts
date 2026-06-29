import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export interface USDCPriceResponse {
  price: number;
  currency: string;
  timestamp: number;
  source: string;
}

export interface USDCPriceError {
  error: string;
}

function getMockUSDCPrice(): number {
  const variance = (Math.random() - 0.5) * 0.001;
  return parseFloat((1.0 + variance).toFixed(4));
}

export default function handler(req: NextRequest): NextResponse {
  if (req.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  return NextResponse.json(
    {
      price: getMockUSDCPrice(),
      currency: 'USD',
      timestamp: Date.now(),
      source: 'mock',
    },
    {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
    }
  );
}
