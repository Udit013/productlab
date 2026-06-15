import { NextResponse } from 'next/server'
import { seedDatabase } from '@/lib/demo/seed'
import { getDb } from '@/lib/db'
import { users, events, features, experiments, experimentResults, opportunities, initiatives, roadmapItems, goals } from '@/lib/db/schema'

export async function POST() {
  try {
    const db = getDb()
    // Clear existing data
    await db.delete(experimentResults)
    await db.delete(roadmapItems)
    await db.delete(initiatives)
    await db.delete(opportunities)
    await db.delete(experiments)
    await db.delete(events)
    await db.delete(users)
    await db.delete(features)
    await db.delete(goals)

    const result = await seedDatabase()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const db = getDb()
    const userRes = await db.execute('SELECT COUNT(*) as count FROM users')
    const eventRes = await db.execute('SELECT COUNT(*) as count FROM events')
    return NextResponse.json({
      users: Number((userRes.rows[0] as Record<string, unknown>)?.count ?? 0),
      events: Number((eventRes.rows[0] as Record<string, unknown>)?.count ?? 0),
    })
  } catch {
    return NextResponse.json({ users: 0, events: 0 })
  }
}
