import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { goals } from '@/lib/db/schema'

export async function GET() {
  try {
    const db = getDb()
    const data = await db.select().from(goals)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json([])
  }
}
