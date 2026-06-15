import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { events } from '@/lib/db/schema'
import { desc, sql, like, gte, lte, and } from 'drizzle-orm'
import { getTopEvents, getDailyActiveUsers } from '@/lib/analytics/funnels'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const action = searchParams.get('action') ?? 'list'
  const eventName = searchParams.get('event')
  const dateFrom = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
  const dateTo = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined
  const limit = Math.min(Number(searchParams.get('limit') ?? 100), 500)

  try {
    const db = getDb()

    if (action === 'top') {
      const data = await getTopEvents(25, dateFrom)
      return NextResponse.json(data)
    }

    if (action === 'dau') {
      const data = await getDailyActiveUsers(dateFrom, dateTo)
      return NextResponse.json(data)
    }

    if (action === 'summary') {
      const result = await db.execute(sql`
        SELECT
          COUNT(*) as total_events,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT event_name) as unique_event_types,
          COUNT(DISTINCT session_id) as unique_sessions,
          MIN(received_at) as first_event,
          MAX(received_at) as last_event
        FROM events
      `)
      return NextResponse.json(result.rows[0] ?? {})
    }

    const conditions = []
    if (eventName) conditions.push(like(events.eventName, `%${eventName}%`))
    if (dateFrom) conditions.push(gte(events.receivedAt, dateFrom))
    if (dateTo) conditions.push(lte(events.receivedAt, dateTo))

    const rows = await db.select({
      id: events.id,
      userId: events.userId,
      sessionId: events.sessionId,
      eventName: events.eventName,
      eventCategory: events.eventCategory,
      properties: events.properties,
      receivedAt: events.receivedAt,
      deviceType: events.deviceType,
      country: events.country,
    })
      .from(events)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(events.receivedAt))
      .limit(limit)

    return NextResponse.json(rows)
  } catch {
    return NextResponse.json(action === 'summary' ? {} : [])
  }
}

export async function POST(req: NextRequest) {
  const db = getDb()
  const body = await req.json()
  const { eventName, userId, anonymousId, properties, sessionId } = body

  if (!eventName) {
    return NextResponse.json({ error: 'eventName is required' }, { status: 400 })
  }

  const [event] = await db.insert(events).values({
    eventName,
    userId: userId ?? null,
    anonymousId: anonymousId ?? null,
    sessionId: sessionId ?? null,
    properties: properties ?? {},
    receivedAt: new Date(),
  }).returning()

  return NextResponse.json(event, { status: 201 })
}
