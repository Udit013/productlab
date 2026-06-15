import { NextRequest, NextResponse } from 'next/server'
import { getRetentionSummary } from '@/lib/analytics/cohorts'
import { getFeatureAdoption } from '@/lib/analytics/adoption'
import { getAllOpportunities } from '@/lib/engines/opportunity'
import { getRankedInitiatives } from '@/lib/engines/prioritization'
import { getDb } from '@/lib/db'
import { goals, experiments } from '@/lib/db/schema'
import { getTopEvents } from '@/lib/analytics/funnels'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const type = searchParams.get('type') ?? 'weekly'

  try {
  const db = getDb()

  const [retention, adoption, opps, initiatives, allGoals, allExperiments, topEvents] = await Promise.all([
    getRetentionSummary(),
    getFeatureAdoption(),
    getAllOpportunities(),
    getRankedInitiatives(),
    db.select().from(goals),
    db.select().from(experiments),
    getTopEvents(10),
  ])

  const topOpportunities = opps.slice(0, 5)
  const topInitiatives = initiatives.slice(0, 5)
  const runningExperiments = allExperiments.filter(e => e.status === 'running')
  const completedWinners = allExperiments.filter(e => e.status === 'completed')

  const report = {
    generatedAt: new Date().toISOString(),
    type,
    period: type === 'weekly' ? 'Last 7 Days' : type === 'monthly' ? 'Last 30 Days' : 'Last Quarter',
    productHealth: {
      score: 78,
      trend: '+3',
      status: 'healthy',
    },
    retention,
    activation: {
      rate: 67.3,
      benchmark: 70,
      trend: '+2.1%',
      topDropOff: 'Step 3: Integration Connect (35% drop-off)',
    },
    experiments: {
      running: runningExperiments.length,
      completed: completedWinners.length,
      winners: 6,
      avgLift: '31.2%',
    },
    topOpportunities,
    topInitiatives,
    goals: allGoals,
    risks: [
      { name: 'D30 Retention Below Target', severity: 'high', description: 'Current 48.2% vs 55% target. Onboarding simplification is critical.' },
      { name: 'Free Tier Churn Rate', severity: 'medium', description: '55% of free users churn within 30 days. Activation rate improvement needed.' },
      { name: 'Enterprise Pipeline Blocked', severity: 'high', description: '23% of enterprise deals blocked on SAML/SCIM requirement.' },
    ],
    recommendations: [
      'Ship simplified 3-step onboarding this sprint',
      'Launch AI Search to Growth and Enterprise plans',
      'Prioritize SAML/SCIM for enterprise pipeline',
      'Run D7 retention experiment for at-risk users',
    ],
  }

  return NextResponse.json(report)
  } catch {
    return NextResponse.json({ error: 'Database unavailable. Load demo data first.' }, { status: 200 })
  }
}
