import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { roadmapItems, initiatives, goals } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
  const db = getDb()
  const [items, allInitiatives, allGoals] = await Promise.all([
    db.select().from(roadmapItems),
    db.select().from(initiatives),
    db.select().from(goals),
  ])

  const quarters = [...new Set(items.map(i => i.quarter))].sort()

  const roadmap = quarters.map(q => ({
    quarter: q,
    items: items
      .filter(i => i.quarter === q)
      .map(item => {
        const initiative = allInitiatives.find(init => init.id === item.initiativeId)
        return {
          ...item,
          priorityScore: initiative?.priorityScore ?? 0,
          expectedRevenueLift: initiative?.expectedRevenueLift ?? 0,
          expectedRetentionLift: initiative?.expectedRetentionLift ?? 0,
          tags: initiative?.tags ?? [],
        }
      })
      .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)),
    totalWeeks: items.filter(i => i.quarter === q).reduce((s, i) => s + (i.estimatedWeeks ?? 0), 0),
    expectedRevenueLift: items.filter(i => i.quarter === q).reduce((s, i) => {
      const init = allInitiatives.find(init => init.id === i.initiativeId)
      return s + (init?.expectedRevenueLift ?? 0)
    }, 0),
  }))

  return NextResponse.json({ roadmap, goals: allGoals })
  } catch {
    return NextResponse.json({ roadmap: [], goals: [] })
  }
}
