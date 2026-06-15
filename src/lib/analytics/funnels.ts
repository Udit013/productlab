import { getDb } from '../db'
import { events, users } from '../db/schema'
import { sql, and, gte, lte, inArray } from 'drizzle-orm'

export interface FunnelStep {
  name: string
  eventName: string
}

export interface FunnelStepResult {
  step: string
  eventName: string
  users: number
  conversionRate: number
  dropOffRate: number
  avgTimeToNext: number | null
}

export interface FunnelResult {
  steps: FunnelStepResult[]
  overallConversion: number
  totalEntered: number
  totalConverted: number
}

const ONBOARDING_FUNNEL: FunnelStep[] = [
  { name: 'Signed Up', eventName: 'signup' },
  { name: 'Started Onboarding', eventName: 'onboarding_step' },
  { name: 'Activated', eventName: 'activation' },
  { name: 'First Feature Use', eventName: 'feature_use' },
  { name: 'First Purchase', eventName: 'purchase' },
]

const ACTIVATION_FUNNEL: FunnelStep[] = [
  { name: 'Page View', eventName: 'page_view' },
  { name: 'Session Start', eventName: 'session_start' },
  { name: 'Feature Click', eventName: 'feature_use' },
  { name: 'Activation', eventName: 'activation' },
]

export async function getFunnelMetrics(
  funnelType: 'onboarding' | 'activation' | 'custom',
  dateFrom?: Date,
  dateTo?: Date
): Promise<FunnelResult> {
  const db = getDb()
  const steps = funnelType === 'onboarding' ? ONBOARDING_FUNNEL : ACTIVATION_FUNNEL

  const conditions = []
  if (dateFrom) conditions.push(gte(events.receivedAt, dateFrom))
  if (dateTo) conditions.push(lte(events.receivedAt, dateTo))

  const stepResults: FunnelStepResult[] = []
  let previousCount = 0

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    const result = await db.execute(sql`
      SELECT COUNT(DISTINCT user_id) as user_count
      FROM events
      WHERE event_name = ${step.eventName}
      ${dateFrom ? sql`AND received_at >= ${dateFrom}` : sql``}
      ${dateTo ? sql`AND received_at <= ${dateTo}` : sql``}
      AND user_id IS NOT NULL
    `)

    const count = Number((result.rows[0] as Record<string, unknown>)?.user_count ?? 0)

    stepResults.push({
      step: step.name,
      eventName: step.eventName,
      users: count,
      conversionRate: i === 0 ? 100 : previousCount > 0 ? (count / previousCount) * 100 : 0,
      dropOffRate: i === 0 ? 0 : previousCount > 0 ? ((previousCount - count) / previousCount) * 100 : 0,
      avgTimeToNext: null,
    })

    previousCount = count
  }

  const totalEntered = stepResults[0]?.users ?? 0
  const totalConverted = stepResults[stepResults.length - 1]?.users ?? 0

  return {
    steps: stepResults,
    overallConversion: totalEntered > 0 ? (totalConverted / totalEntered) * 100 : 0,
    totalEntered,
    totalConverted,
  }
}

export async function getEventVolume(dateFrom?: Date, dateTo?: Date) {
  const db = getDb()
  const result = await db.execute(sql`
    SELECT
      event_name,
      COUNT(*) as event_count,
      COUNT(DISTINCT user_id) as unique_users,
      DATE_TRUNC('day', received_at) as day
    FROM events
    ${dateFrom ? sql`WHERE received_at >= ${dateFrom}` : sql``}
    ${dateTo ? sql`AND received_at <= ${dateTo}` : sql``}
    GROUP BY event_name, DATE_TRUNC('day', received_at)
    ORDER BY day DESC, event_count DESC
    LIMIT 500
  `)
  return result.rows
}

export async function getDailyActiveUsers(dateFrom?: Date, dateTo?: Date) {
  const db = getDb()
  const result = await db.execute(sql`
    SELECT
      DATE_TRUNC('day', received_at) as day,
      COUNT(DISTINCT user_id) as dau,
      COUNT(*) as total_events
    FROM events
    WHERE user_id IS NOT NULL
    ${dateFrom ? sql`AND received_at >= ${dateFrom}` : sql``}
    ${dateTo ? sql`AND received_at <= ${dateTo}` : sql``}
    GROUP BY DATE_TRUNC('day', received_at)
    ORDER BY day
  `)
  return result.rows
}

export async function getTopEvents(limit = 20, dateFrom?: Date) {
  const db = getDb()
  const result = await db.execute(sql`
    SELECT
      event_name,
      event_category,
      COUNT(*) as total,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(DISTINCT session_id) as unique_sessions
    FROM events
    ${dateFrom ? sql`WHERE received_at >= ${dateFrom}` : sql``}
    GROUP BY event_name, event_category
    ORDER BY total DESC
    LIMIT ${limit}
  `)
  return result.rows
}
