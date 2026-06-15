import { NextRequest, NextResponse } from 'next/server'
import { getRetentionCohorts, getRetentionSummary } from '@/lib/analytics/cohorts'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const action = searchParams.get('action') ?? 'cohorts'
  const granularity = (searchParams.get('granularity') ?? 'month') as 'week' | 'month'

  try {
    if (action === 'summary') {
      const data = await getRetentionSummary()
      return NextResponse.json(data)
    }
    const data = await getRetentionCohorts(granularity)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(action === 'summary' ? { d1: 0, d7: 0, d30: 0, d90: 0 } : [])
  }
}
