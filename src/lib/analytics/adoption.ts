import { getDb } from '../db'
import { sql } from 'drizzle-orm'

export interface FeatureAdoptionRow {
  featureSlug: string
  featureName: string
  category: string
  adoptedUsers: number
  totalUsers: number
  adoptionRate: number
  engagementRate: number
  avgUsesPerUser: number
  stickiness: number
}

export async function getFeatureAdoption(): Promise<FeatureAdoptionRow[]> {
  const db = getDb()
  const result = await db.execute(sql`
    WITH total_users AS (
      SELECT COUNT(DISTINCT user_id) as cnt
      FROM events
      WHERE event_name = 'session_start' AND user_id IS NOT NULL
    ),
    feature_usage AS (
      SELECT
        (properties->>'feature') as feature_slug,
        (properties->>'featureName') as feature_name,
        COUNT(DISTINCT user_id) as adopted_users,
        COUNT(*) as total_uses,
        COUNT(DISTINCT DATE_TRUNC('day', received_at)) as active_days,
        COUNT(DISTINCT DATE_TRUNC('week', received_at)) as active_weeks
      FROM events
      WHERE event_name = 'feature_use'
        AND properties->>'feature' IS NOT NULL
        AND user_id IS NOT NULL
      GROUP BY properties->>'feature', properties->>'featureName'
    )
    SELECT
      f.feature_slug,
      f.feature_name,
      f.adopted_users,
      t.cnt as total_users,
      (f.adopted_users::float / NULLIF(t.cnt, 0) * 100) as adoption_rate,
      (f.total_uses::float / NULLIF(f.adopted_users, 0)) as avg_uses_per_user,
      (f.active_weeks::float / 52 * 100) as stickiness
    FROM feature_usage f, total_users t
    ORDER BY adoption_rate DESC
  `)

  return result.rows.map((r: Record<string, unknown>) => ({
    featureSlug: String(r.feature_slug ?? ''),
    featureName: String(r.feature_name ?? r.feature_slug ?? ''),
    category: 'product',
    adoptedUsers: Number(r.adopted_users ?? 0),
    totalUsers: Number(r.total_users ?? 0),
    adoptionRate: Math.round(Number(r.adoption_rate ?? 0) * 10) / 10,
    engagementRate: Math.round(Number(r.avg_uses_per_user ?? 0) * 10) / 10,
    avgUsesPerUser: Math.round(Number(r.avg_uses_per_user ?? 0) * 10) / 10,
    stickiness: Math.round(Number(r.stickiness ?? 0) * 10) / 10,
  }))
}

export async function getUserSegments() {
  const db = getDb()

  const result = await db.execute(sql`
    WITH user_stats AS (
      SELECT
        u.id,
        u.plan,
        u.is_active,
        u.signed_up_at,
        u.last_seen_at,
        COUNT(DISTINCT e.session_id) as session_count,
        COUNT(DISTINCT e.id) as event_count,
        COUNT(DISTINCT DATE_TRUNC('week', e.received_at)) as active_weeks,
        EXTRACT(EPOCH FROM (NOW() - u.last_seen_at)) / 86400 as days_inactive,
        EXTRACT(EPOCH FROM (NOW() - u.signed_up_at)) / 86400 as days_since_signup
      FROM users u
      LEFT JOIN events e ON u.id = e.user_id
      GROUP BY u.id, u.plan, u.is_active, u.signed_up_at, u.last_seen_at
    )
    SELECT
      CASE
        WHEN days_since_signup <= 14 THEN 'new'
        WHEN days_inactive > 60 THEN 'churned'
        WHEN days_inactive > 21 THEN 'churn_risk'
        WHEN session_count >= 50 AND active_weeks >= 20 THEN 'power'
        WHEN plan IN ('growth','enterprise') AND session_count >= 20 THEN 'expansion'
        ELSE 'casual'
      END as segment,
      COUNT(*) as user_count,
      AVG(session_count) as avg_sessions,
      AVG(active_weeks) as avg_active_weeks,
      AVG(days_inactive) as avg_days_inactive
    FROM user_stats
    GROUP BY 1
    ORDER BY user_count DESC
  `)

  return result.rows.map((r: Record<string, unknown>) => ({
    segment: String(r.segment ?? ''),
    userCount: Number(r.user_count ?? 0),
    avgSessions: Math.round(Number(r.avg_sessions ?? 0)),
    avgActiveWeeks: Math.round(Number(r.avg_active_weeks ?? 0)),
    avgDaysInactive: Math.round(Number(r.avg_days_inactive ?? 0)),
  }))
}

export async function getPlanBreakdown() {
  const db = getDb()
  const result = await db.execute(sql`
    SELECT plan, COUNT(*) as count, COUNT(*) FILTER (WHERE is_active) as active_count
    FROM users
    GROUP BY plan
    ORDER BY
      CASE plan
        WHEN 'enterprise' THEN 1
        WHEN 'growth' THEN 2
        WHEN 'starter' THEN 3
        ELSE 4
      END
  `)
  return result.rows
}
