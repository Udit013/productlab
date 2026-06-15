import { NextRequest, NextResponse } from 'next/server'
import { getFunnelMetrics } from '@/lib/analytics/funnels'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const type = (searchParams.get('type') ?? 'onboarding') as 'onboarding' | 'activation'
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined

  try {
    const data = await getFunnelMetrics(type, from, to)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ steps: [], overallConversion: 0, totalEntered: 0, totalConverted: 0 })
  }
}
