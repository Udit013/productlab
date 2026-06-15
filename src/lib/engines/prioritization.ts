import { getDb } from '../db'
import { initiatives } from '../db/schema'
import { desc } from 'drizzle-orm'
import { calculateRICE, calculateICE, calculateWSJF, calculateROI } from './statistics'

export type ScoringModel = 'rice' | 'ice' | 'wsjf' | 'priority'

export interface RankedInitiative {
  id: string
  name: string
  description: string
  status: string
  quarter: string | null
  reach: number
  impact: number
  confidence: number
  effort: number
  riceScore: number
  iceScore: number
  wsjfScore: number
  priorityScore: number
  strategicAlignment: number
  expectedRoi: number
  expectedRetentionLift: number
  expectedRevenueLift: number
  engineeringCost: number
  recommendation: string | null
  tags: string[]
  rank: number
}

export async function getRankedInitiatives(model: ScoringModel = 'priority'): Promise<RankedInitiative[]> {
  const db = getDb()
  const rows = await db.select().from(initiatives).orderBy(desc(initiatives.priorityScore))

  const sorted = rows.sort((a, b) => {
    const scoreA = model === 'rice' ? (a.riceScore ?? 0) :
      model === 'ice' ? (a.iceScore ?? 0) :
        model === 'wsjf' ? (a.wsjfScore ?? 0) :
          (a.priorityScore ?? 0)
    const scoreB = model === 'rice' ? (b.riceScore ?? 0) :
      model === 'ice' ? (b.iceScore ?? 0) :
        model === 'wsjf' ? (b.wsjfScore ?? 0) :
          (b.priorityScore ?? 0)
    return scoreB - scoreA
  })

  return sorted.map((row, idx) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    status: row.status ?? 'backlog',
    quarter: row.quarter,
    reach: row.reach ?? 0,
    impact: row.impact ?? 0,
    confidence: row.confidence ?? 0,
    effort: row.effort ?? 0,
    riceScore: row.riceScore ?? 0,
    iceScore: row.iceScore ?? 0,
    wsjfScore: row.wsjfScore ?? 0,
    priorityScore: row.priorityScore ?? 0,
    strategicAlignment: row.strategicAlignment ?? 0,
    expectedRoi: row.expectedRoi ?? 0,
    expectedRetentionLift: row.expectedRetentionLift ?? 0,
    expectedRevenueLift: row.expectedRevenueLift ?? 0,
    engineeringCost: row.engineeringCost ?? 0,
    recommendation: row.recommendation,
    tags: (row.tags as string[]) ?? [],
    rank: idx + 1,
  }))
}

export async function getPrioritizationSummary() {
  const db = getDb()
  const rows = await db.select().from(initiatives)
  const total = rows.length
  const totalRevenueLift = rows.reduce((s, r) => s + (r.expectedRevenueLift ?? 0), 0)
  const avgPriorityScore = total > 0 ? rows.reduce((s, r) => s + (r.priorityScore ?? 0), 0) / total : 0

  return {
    total,
    inProgress: rows.filter(r => r.status === 'in_progress').length,
    planned: rows.filter(r => r.status === 'planned').length,
    backlog: rows.filter(r => r.status === 'backlog').length,
    totalExpectedRevenueLift: Math.round(totalRevenueLift),
    avgPriorityScore: Math.round(avgPriorityScore),
    topInitiative: rows.sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0))[0]?.name ?? 'N/A',
  }
}
