import 'dotenv/config'
import { sql } from 'drizzle-orm'
import { seedDatabase } from '../src/lib/demo/seed'
import { getDb } from '../src/lib/db'

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required (set it in .env.local or pass inline)')
  }

  const db = getDb()

  console.log('Clearing existing data...')
  // TRUNCATE (not DELETE) to reclaim storage immediately and avoid bloating
  // history/WAL — important on storage-limited tiers like Neon free.
  await db.execute(sql`
    TRUNCATE TABLE
      experiment_results, roadmap_items, initiatives, opportunities,
      experiments, events, users, features, goals
    RESTART IDENTITY CASCADE
  `)

  const result = await seedDatabase()
  console.log(`\n✓ Seed complete: ${result.users.toLocaleString()} users, ${result.events.toLocaleString()} events`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
