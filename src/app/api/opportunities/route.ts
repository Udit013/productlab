import { NextResponse } from 'next/server'
import { getAllOpportunities, getOpportunitySummary } from '@/lib/engines/opportunity'

export async function GET() {
  try {
    const [opportunities, summary] = await Promise.all([
      getAllOpportunities(),
      getOpportunitySummary(),
    ])
    return NextResponse.json({ opportunities, summary })
  } catch {
    return NextResponse.json({ opportunities: [], summary: null })
  }
}
