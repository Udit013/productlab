import { NextRequest, NextResponse } from 'next/server'
import { getRankedInitiatives, getPrioritizationSummary, type ScoringModel } from '@/lib/engines/prioritization'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const model = (searchParams.get('model') ?? 'priority') as ScoringModel

  try {
    const [initiatives, summary] = await Promise.all([
      getRankedInitiatives(model),
      getPrioritizationSummary(),
    ])
    return NextResponse.json({ initiatives, summary })
  } catch {
    return NextResponse.json({ initiatives: [], summary: null })
  }
}
