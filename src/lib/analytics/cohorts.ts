import { getDb } from '../db'
import { sql } from 'drizzle-orm'

export interface CohortRow {
  cohortDate: string
  cohortSize: number
  d1: number
  d7: number
  d14: number
  d30: number
  d60: number
  d90: number
}

export async function getRetentionCohorts(granularity: 'week' | 'month' = 'month'): Promise<CohortRow[]> {
  const db = getDb()
  const truncUnit = granularity === 'week' ? 'week' : 'month'

  const result = await db.execute(sql`
    WITH signups AS (
      SELECT
        user_id,
        DATE_TRUNC(${truncUnit}, received_at) as cohort_date,
        received_at as signup_date
      FROM events
      WHERE event_name = 'signup' AND user_id IS NOT NULL
    ),
    activity AS (
      SELECT DISTINCT
        e.user_id,
        DATE_TRUNC(${truncUnit}, e.received_at) as activity_date
      FROM events e
      WHERE e.user_id IS NOT NULL AND e.event_name = 'session_start'
    ),
    cohort_data AS (
      SELECT
        s.cohort_date,
        s.user_id,
        a.activity_date,
        EXTRACT(EPOCH FROM (a.activity_date - s.cohort_date)) / 86400 as days_since_signup
      FROM signups s
      LEFT JOIN activity a ON s.user_id = a.user_id
        AND a.activity_date >= s.cohort_date
    )
    SELECT
      cohort_date::text,
      COUNT(DISTINCT user_id) as cohort_size,
      COUNT(DISTINCT CASE WHEN days_since_signup BETWEEN 1 AND 2 THEN user_id END)::float /
        NULLIF(COUNT(DISTINCT user_id), 0) * 100 as d1,
      COUNT(DISTINCT CASE WHEN days_since_signup BETWEEN 6 AND 8 THEN user_id END)::float /
        NULLIF(COUNT(DISTINCT user_id), 0) * 100 as d7,
      COUNT(DISTINCT CASE WHEN days_since_signup BETWEEN 13 AND 16 THEN user_id END)::float /
        NULLIF(COUNT(DISTINCT user_id), 0) * 100 as d14,
      COUNT(DISTINCT CASE WHEN days_since_signup BETWEEN 28 AND 32 THEN user_id END)::float /
        NULLIF(COUNT(DISTINCT user_id), 0) * 100 as d30,
      COUNT(DISTINCT CASE WHEN days_since_signup BETWEEN 58 AND 63 THEN user_id END)::float /
        NULLIF(COUNT(DISTINCT user_id), 0) * 100 as d60,
      COUNT(DISTINCT CASE WHEN days_since_signup BETWEEN 88 AND 93 THEN user_id END)::float /
        NULLIF(COUNT(DISTINCT user_id), 0) * 100 as d90
    FROM cohort_data
    GROUP BY cohort_date
    ORDER BY cohort_date DESC
    LIMIT 12
  `)

  return result.rows.map((r: Record<string, unknown>) => ({
    cohortDate: String(r.cohort_date ?? ''),
    cohortSize: Number(r.cohort_size ?? 0),
    d1: Number(r.d1 ?? 0),
    d7: Number(r.d7 ?? 0),
    d14: Number(r.d14 ?? 0),
    d30: Number(r.d30 ?? 0),
    d60: Number(r.d60 ?? 0),
    d90: Number(r.d90 ?? 0),
  }))
}

export async function getRetentionSummary() {
  const db = getDb()
  const result = await db.execute(sql`
    WITH signups AS (
      SELECT user_id, MIN(received_at) as signup_date
      FROM events WHERE event_name = 'signup' AND user_id IS NOT NULL
      GROUP BY user_id
    ),
    returning AS (
      SELECT
        s.user_id,
        EXTRACT(EPOCH FROM (e.received_at - s.signup_date)) / 86400 as days_diff
      FROM signups s
      JOIN events e ON s.user_id = e.user_id
        AND e.event_name = 'session_start'
        AND e.received_at > s.signup_date
    )
    SELECT
      COUNT(DISTINCT CASE WHEN days_diff BETWEEN 0 AND 2 THEN user_id END)::float /
        NULLIF((SELECT COUNT(DISTINCT user_id) FROM signups), 0) * 100 as d1_retention,
      COUNT(DISTINCT CASE WHEN days_diff BETWEEN 5 AND 9 THEN user_id END)::float /
        NULLIF((SELECT COUNT(DISTINCT user_id) FROM signups), 0) * 100 as d7_retention,
      COUNT(DISTINCT CASE WHEN days_diff BETWEEN 25 AND 35 THEN user_id END)::float /
        NULLIF((SELECT COUNT(DISTINCT user_id) FROM signups), 0) * 100 as d30_retention,
      COUNT(DISTINCT CASE WHEN days_diff BETWEEN 85 AND 95 THEN user_id END)::float /
        NULLIF((SELECT COUNT(DISTINCT user_id) FROM signups), 0) * 100 as d90_retention
    FROM returning
  `)

  const row = result.rows[0] as Record<string, unknown>
  return {
    d1: Math.round(Number(row?.d1_retention ?? 0) * 10) / 10,
    d7: Math.round(Number(row?.d7_retention ?? 0) * 10) / 10,
    d30: Math.round(Number(row?.d30_retention ?? 0) * 10) / 10,
    d90: Math.round(Number(row?.d90_retention ?? 0) * 10) / 10,
  }
}
