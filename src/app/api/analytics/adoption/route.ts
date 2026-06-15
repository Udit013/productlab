import { NextResponse } from 'next/server'
import { getFeatureAdoption, getPlanBreakdown } from '@/lib/analytics/adoption'

export async function GET() {
  try {
    const [adoption, plans] = await Promise.all([
      getFeatureAdoption(),
      getPlanBreakdown(),
    ])
    return NextResponse.json({ adoption, plans })
  } catch {
    return NextResponse.json({ adoption: [], plans: [] })
  }
}
