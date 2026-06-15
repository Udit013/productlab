import 'dotenv/config'
import { seedDatabase } from '../src/lib/demo/seed'
import { getDb } from '../src/lib/db'
import {
  users, events, features, experiments, experimentResults,
  opportunities, initiatives, roadmapItems, goals,
} from '../src/lib/db/schema'

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required (set it in .env.local or pass inline)')
  }

  const db = getDb()

  console.log('Clearing existing data...')
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
  console.log(`\n✓ Seed complete: ${result.users.toLocaleString()} users, ${result.events.toLocaleString()} events`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
