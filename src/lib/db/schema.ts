import { pgTable, text, integer, real, boolean, timestamp, jsonb, uuid, varchar, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  anonymousId: varchar('anonymous_id', { length: 255 }),
  email: varchar('email', { length: 255 }),
  name: varchar('name', { length: 255 }),
  plan: varchar('plan', { length: 50 }).default('free'),
  country: varchar('country', { length: 100 }),
  company: varchar('company', { length: 255 }),
  role: varchar('role', { length: 100 }),
  signupSource: varchar('signup_source', { length: 100 }),
  signedUpAt: timestamp('signed_up_at').defaultNow(),
  lastSeenAt: timestamp('last_seen_at').defaultNow(),
  isActive: boolean('is_active').default(true),
  traits: jsonb('traits').$type<Record<string, unknown>>(),
}, (t) => [
  index('users_anonymous_id_idx').on(t.anonymousId),
  index('users_email_idx').on(t.email),
  index('users_signed_up_at_idx').on(t.signedUpAt),
])

// ─── Events ──────────────────────────────────────────────────────────────────

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  anonymousId: varchar('anonymous_id', { length: 255 }),
  sessionId: varchar('session_id', { length: 255 }),
  eventName: varchar('event_name', { length: 255 }).notNull(),
  eventCategory: varchar('event_category', { length: 100 }),
  properties: jsonb('properties').$type<Record<string, unknown>>(),
  page: varchar('page', { length: 500 }),
  referrer: varchar('referrer', { length: 500 }),
  deviceType: varchar('device_type', { length: 50 }),
  browser: varchar('browser', { length: 100 }),
  country: varchar('country', { length: 100 }),
  receivedAt: timestamp('received_at').defaultNow().notNull(),
}, (t) => [
  index('events_user_id_idx').on(t.userId),
  index('events_event_name_idx').on(t.eventName),
  index('events_received_at_idx').on(t.receivedAt),
  index('events_session_id_idx').on(t.sessionId),
])

// ─── Feature Definitions ─────────────────────────────────────────────────────

export const features = pgTable('features', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  trackingEvent: varchar('tracking_event', { length: 255 }),
  isCore: boolean('is_core').default(false),
  launchedAt: timestamp('launched_at'),
  createdAt: timestamp('created_at').defaultNow(),
})

// ─── Experiments ─────────────────────────────────────────────────────────────

export const experiments = pgTable('experiments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  hypothesis: text('hypothesis'),
  status: varchar('status', { length: 50 }).default('draft'),
  type: varchar('type', { length: 50 }).default('ab'),
  variants: jsonb('variants').$type<Array<{ name: string; description: string; trafficPercent: number }>>(),
  primaryMetric: varchar('primary_metric', { length: 255 }),
  secondaryMetrics: jsonb('secondary_metrics').$type<string[]>(),
  targetSegment: varchar('target_segment', { length: 255 }),
  trafficAllocation: real('traffic_allocation').default(100),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const experimentResults = pgTable('experiment_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  experimentId: uuid('experiment_id').references(() => experiments.id).notNull(),
  variant: varchar('variant', { length: 100 }).notNull(),
  metric: varchar('metric', { length: 255 }).notNull(),
  sampleSize: integer('sample_size').default(0),
  conversions: integer('conversions').default(0),
  conversionRate: real('conversion_rate').default(0),
  meanValue: real('mean_value'),
  stdDev: real('std_dev'),
  liftPercent: real('lift_percent'),
  pValue: real('p_value'),
  confidenceInterval: jsonb('confidence_interval').$type<[number, number]>(),
  isSignificant: boolean('is_significant').default(false),
  verdict: varchar('verdict', { length: 50 }),
  calculatedAt: timestamp('calculated_at').defaultNow(),
})

// ─── Opportunities ────────────────────────────────────────────────────────────

export const opportunities = pgTable('opportunities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  description: text('description'),
  opportunityScore: real('opportunity_score').default(0),
  userImpact: real('user_impact').default(0),
  businessImpact: real('business_impact').default(0),
  confidenceScore: real('confidence_score').default(0),
  evidence: jsonb('evidence').$type<string[]>(),
  affectedUsers: integer('affected_users').default(0),
  status: varchar('status', { length: 50 }).default('active'),
  discoveredAt: timestamp('discovered_at').defaultNow(),
})

// ─── Initiatives / Prioritization ────────────────────────────────────────────

export const initiatives = pgTable('initiatives', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  opportunityId: uuid('opportunity_id').references(() => opportunities.id),
  status: varchar('status', { length: 50 }).default('backlog'),
  reach: real('reach').default(0),
  impact: real('impact').default(0),
  confidence: real('confidence').default(0),
  effort: real('effort').default(0),
  riceScore: real('rice_score').default(0),
  iceScore: real('ice_score').default(0),
  wsjfScore: real('wsjf_score').default(0),
  priorityScore: real('priority_score').default(0),
  strategicAlignment: real('strategic_alignment').default(0),
  expectedRoi: real('expected_roi').default(0),
  expectedRetentionLift: real('expected_retention_lift').default(0),
  expectedRevenueLift: real('expected_revenue_lift').default(0),
  engineeringCost: integer('engineering_cost').default(0),
  recommendation: text('recommendation'),
  quarter: varchar('quarter', { length: 20 }),
  tags: jsonb('tags').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ─── Roadmap Items ────────────────────────────────────────────────────────────

export const roadmapItems = pgTable('roadmap_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  initiativeId: uuid('initiative_id').references(() => initiatives.id),
  name: varchar('name', { length: 255 }).notNull(),
  quarter: varchar('quarter', { length: 20 }).notNull(),
  status: varchar('status', { length: 50 }).default('planned'),
  priority: integer('priority').default(0),
  estimatedWeeks: integer('estimated_weeks').default(2),
  dependencies: jsonb('dependencies').$type<string[]>(),
  expectedOutcome: text('expected_outcome'),
  createdAt: timestamp('created_at').defaultNow(),
})

// ─── Goals ───────────────────────────────────────────────────────────────────

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }),
  targetValue: real('target_value'),
  currentValue: real('current_value'),
  unit: varchar('unit', { length: 50 }),
  quarter: varchar('quarter', { length: 20 }),
  status: varchar('status', { length: 50 }).default('on_track'),
  createdAt: timestamp('created_at').defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
export type Feature = typeof features.$inferSelect
export type Experiment = typeof experiments.$inferSelect
export type ExperimentResult = typeof experimentResults.$inferSelect
export type Opportunity = typeof opportunities.$inferSelect
export type Initiative = typeof initiatives.$inferSelect
export type RoadmapItem = typeof roadmapItems.$inferSelect
export type Goal = typeof goals.$inferSelect
