import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { experiments, experimentResults } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const id = searchParams.get('id')

  try {
    const db = getDb()

    if (id) {
      const [exp] = await db.select().from(experiments).where(eq(experiments.id, id))
      const results = await db.select().from(experimentResults).where(eq(experimentResults.experimentId, id))
      return NextResponse.json({ experiment: exp, results })
    }

    const allExperiments = await db.select().from(experiments).orderBy(desc(experiments.startedAt))
    const allResults = await db.select().from(experimentResults)

    const enriched = allExperiments.map(exp => {
      const results = allResults.filter(r => r.experimentId === exp.id)
      const winner = results.find(r => r.verdict === 'winner')
      const significant = results.some(r => r.isSignificant)
      const maxLift = Math.max(...results.map(r => r.liftPercent ?? 0))
      return {
        ...exp,
        results,
        hasWinner: !!winner,
        isSignificant: significant,
        maxLift,
        verdict: exp.status === 'running' ? 'running' :
          exp.status === 'draft' ? 'draft' :
            winner ? 'winner' : significant ? 'inconclusive' : 'inconclusive',
      }
    })

    return NextResponse.json(enriched)
  } catch {
    return NextResponse.json(id ? { experiment: null, results: [] } : [])
  }
}

export async function POST(req: NextRequest) {
  const db = getDb()
  const body = await req.json()

  const [exp] = await db.insert(experiments).values({
    name: body.name,
    description: body.description,
    hypothesis: body.hypothesis,
    status: body.status ?? 'draft',
    type: body.type ?? 'ab',
    variants: body.variants,
    primaryMetric: body.primaryMetric,
    targetSegment: body.targetSegment,
    trafficAllocation: body.trafficAllocation ?? 100,
  }).returning()

  return NextResponse.json(exp, { status: 201 })
}
