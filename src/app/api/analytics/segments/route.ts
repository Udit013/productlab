import { NextResponse } from 'next/server'
import { getUserSegments } from '@/lib/analytics/adoption'

export async function GET() {
  try {
    const data = await getUserSegments()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json([])
  }
}
