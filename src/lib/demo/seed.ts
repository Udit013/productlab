import { getDb } from '../db'
import { users, events, features, experiments, experimentResults, opportunities, initiatives, roadmapItems, goals } from '../db/schema'

const FEATURE_LIST = [
  { name: 'AI Search', slug: 'ai-search', category: 'core', trackingEvent: 'feature_use', isCore: false },
  { name: 'Dashboard', slug: 'dashboard', category: 'core', trackingEvent: 'feature_use', isCore: true },
  { name: 'Reports', slug: 'reports', category: 'analytics', trackingEvent: 'feature_use', isCore: true },
  { name: 'Team Collaboration', slug: 'team-collab', category: 'collaboration', trackingEvent: 'feature_use', isCore: false },
  { name: 'API Access', slug: 'api-access', category: 'developer', trackingEvent: 'feature_use', isCore: false },
  { name: 'Data Export', slug: 'data-export', category: 'analytics', trackingEvent: 'feature_use', isCore: false },
  { name: 'Custom Dashboards', slug: 'custom-dashboards', category: 'analytics', trackingEvent: 'feature_use', isCore: false },
  { name: 'Notifications', slug: 'notifications', category: 'engagement', trackingEvent: 'feature_use', isCore: true },
  { name: 'Integrations', slug: 'integrations', category: 'developer', trackingEvent: 'feature_use', isCore: false },
  { name: 'Onboarding Wizard', slug: 'onboarding-wizard', category: 'onboarding', trackingEvent: 'onboarding_step', isCore: true },
  { name: 'Mobile App', slug: 'mobile-app', category: 'platform', trackingEvent: 'feature_use', isCore: false },
  { name: 'Advanced Filters', slug: 'advanced-filters', category: 'analytics', trackingEvent: 'feature_use', isCore: false },
  { name: 'Saved Views', slug: 'saved-views', category: 'analytics', trackingEvent: 'feature_use', isCore: false },
  { name: 'Bulk Actions', slug: 'bulk-actions', category: 'productivity', trackingEvent: 'feature_use', isCore: false },
  { name: 'Dark Mode', slug: 'dark-mode', category: 'ux', trackingEvent: 'feature_use', isCore: false },
  { name: 'Keyboard Shortcuts', slug: 'keyboard-shortcuts', category: 'productivity', trackingEvent: 'feature_use', isCore: false },
  { name: 'Comment Threads', slug: 'comment-threads', category: 'collaboration', trackingEvent: 'feature_use', isCore: false },
  { name: 'Goal Tracking', slug: 'goal-tracking', category: 'analytics', trackingEvent: 'feature_use', isCore: false },
  { name: 'Automation Rules', slug: 'automation-rules', category: 'productivity', trackingEvent: 'feature_use', isCore: false },
  { name: 'Audit Log', slug: 'audit-log', category: 'security', trackingEvent: 'feature_use', isCore: false },
  { name: 'SSO Login', slug: 'sso-login', category: 'security', trackingEvent: 'login', isCore: false },
  { name: 'Two-Factor Auth', slug: '2fa', category: 'security', trackingEvent: 'feature_use', isCore: false },
  { name: 'CSV Import', slug: 'csv-import', category: 'data', trackingEvent: 'feature_use', isCore: false },
  { name: 'Webhooks', slug: 'webhooks', category: 'developer', trackingEvent: 'feature_use', isCore: false },
  { name: 'White Labeling', slug: 'white-labeling', category: 'enterprise', trackingEvent: 'feature_use', isCore: false },
]

const PLANS = ['free', 'starter', 'growth', 'enterprise']
const PLAN_WEIGHTS = [0.45, 0.30, 0.17, 0.08]
const COUNTRIES = ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'IN', 'SG', 'BR', 'NL']
const COUNTRY_WEIGHTS = [0.35, 0.12, 0.08, 0.07, 0.08, 0.06, 0.09, 0.04, 0.05, 0.06]
const ROLES = ['Product Manager', 'Engineer', 'Designer', 'Analyst', 'Founder', 'Marketing', 'Sales']
const DEVICES = ['desktop', 'mobile', 'tablet']
const BROWSERS = ['Chrome', 'Safari', 'Firefox', 'Edge']
const SOURCES = ['organic', 'paid', 'referral', 'social', 'email', 'direct']

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

const rand = rng(42)

function pick<T>(arr: T[], weights?: number[]): T {
  if (!weights) return arr[Math.floor(rand() * arr.length)]
  const r = rand()
  let cumulative = 0
  for (let i = 0; i < arr.length; i++) {
    cumulative += weights[i]
    if (r < cumulative) return arr[i]
  }
  return arr[arr.length - 1]
}

function gaussian(mean: number, std: number): number {
  // Box-Muller. Clamp u1 to (0, 1] so the sqrt argument is always >= 0
  // (u1 + constant could exceed 1, making -2*log negative -> NaN).
  const u1 = Math.min(Math.max(rand(), 1e-9), 1)
  const u2 = rand()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return Math.max(0, mean + std * z)
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function addHours(date: Date, hours: number): Date {
  const d = new Date(date)
  d.setHours(d.getHours() + hours)
  return d
}

function addMinutes(date: Date, minutes: number): Date {
  const d = new Date(date)
  d.setMinutes(d.getMinutes() + minutes)
  return d
}

const START_DATE = new Date('2024-01-01')
const END_DATE = new Date('2024-12-31')

function randomDateBetween(start: Date, end: Date): Date {
  const ms = start.getTime() + rand() * (end.getTime() - start.getTime())
  return new Date(ms)
}

export async function seedDatabase() {
  const db = getDb()

  console.log('Seeding features...')
  const featureRows = await db.insert(features).values(
    FEATURE_LIST.map(f => ({
      ...f,
      launchedAt: randomDateBetween(START_DATE, addDays(START_DATE, 90)),
    }))
  ).returning()

  console.log('Seeding users...')
  const userCount = 10000
  const userRows = []

  for (let i = 0; i < userCount; i++) {
    const plan = pick(PLANS, PLAN_WEIGHTS)
    const signupDate = randomDateBetween(START_DATE, addDays(END_DATE, -30))
    const isChurned = rand() < (plan === 'free' ? 0.55 : plan === 'starter' ? 0.35 : plan === 'growth' ? 0.20 : 0.10)
    const lastSeenDaysAgo = isChurned
      ? Math.floor(gaussian(90, 30))
      : Math.floor(gaussian(3, 5))

    userRows.push({
      email: `user${i + 1}@example.com`,
      name: `User ${i + 1}`,
      plan,
      country: pick(COUNTRIES, COUNTRY_WEIGHTS),
      role: pick(ROLES),
      signupSource: pick(SOURCES),
      signedUpAt: signupDate,
      lastSeenAt: addDays(new Date(), -Math.max(0, lastSeenDaysAgo)),
      isActive: !isChurned,
    })
  }

  const insertedUsers = []
  const batchSize = 500
  for (let i = 0; i < userRows.length; i += batchSize) {
    const batch = await db.insert(users).values(userRows.slice(i, i + batchSize)).returning()
    insertedUsers.push(...batch)
  }

  console.log('Seeding events...')
  const eventBatches: typeof events.$inferInsert[] = []

  for (const user of insertedUsers) {
    const signupDate = user.signedUpAt!
    const lastSeen = user.lastSeenAt!
    const isActive = user.isActive!
    const plan = user.plan!
    const daysSinceSignup = Math.max(1, Math.floor((lastSeen.getTime() - signupDate.getTime()) / 86400000))

    // Session frequency based on plan & activity
    const sessionsPerWeek = plan === 'enterprise' ? gaussian(12, 3) :
      plan === 'growth' ? gaussian(7, 2) :
        plan === 'starter' ? gaussian(4, 2) :
          gaussian(2, 1.5)

    const totalSessions = Math.max(1, Math.floor(sessionsPerWeek * daysSinceSignup / 7))

    // signup event
    eventBatches.push({
      userId: user.id,
      sessionId: `sess_${user.id}_0`,
      eventName: 'signup',
      eventCategory: 'acquisition',
      properties: { plan, source: user.signupSource },
      deviceType: pick(DEVICES),
      browser: pick(BROWSERS),
      country: user.country,
      receivedAt: signupDate,
    })

    // Onboarding funnel
    const onboardingSteps = ['profile_setup', 'team_invite', 'integration_connect', 'first_report', 'activation']
    let completedOnboarding = false
    const onboardingStart = addMinutes(signupDate, 2)
    let onboardingTime = onboardingStart

    for (let step = 0; step < onboardingSteps.length; step++) {
      const dropProbability = step === 0 ? 0.05 : step === 1 ? 0.20 : step === 2 ? 0.35 : step === 3 ? 0.20 : 0.10
      if (rand() < dropProbability) break

      onboardingTime = addMinutes(onboardingTime, Math.floor(gaussian(3, 1.5)))
      eventBatches.push({
        userId: user.id,
        sessionId: `sess_${user.id}_0`,
        eventName: 'onboarding_step',
        eventCategory: 'onboarding',
        properties: { step: onboardingSteps[step], stepNumber: step + 1 },
        deviceType: pick(DEVICES),
        browser: pick(BROWSERS),
        country: user.country,
        receivedAt: onboardingTime,
      })

      if (step === onboardingSteps.length - 1) {
        completedOnboarding = true
        eventBatches.push({
          userId: user.id,
          sessionId: `sess_${user.id}_0`,
          eventName: 'activation',
          eventCategory: 'onboarding',
          properties: { timeToActivate: Math.floor((onboardingTime.getTime() - signupDate.getTime()) / 60000) },
          deviceType: pick(DEVICES),
          browser: pick(BROWSERS),
          country: user.country,
          receivedAt: addMinutes(onboardingTime, 1),
        })
      }
    }

    // Feature adoption based on plan and activation
    const featureAdoptionRates: Record<string, number> = {
      'dashboard': 0.95,
      'reports': completedOnboarding ? 0.82 : 0.35,
      'notifications': 0.70,
      'onboarding-wizard': 1.0,
      'ai-search': plan !== 'free' ? 0.45 : 0.10,
      'team-collab': plan === 'enterprise' ? 0.90 : plan === 'growth' ? 0.60 : 0.15,
      'api-access': ['enterprise', 'growth'].includes(plan) ? 0.70 : 0.05,
      'data-export': plan !== 'free' ? 0.55 : 0.08,
      'custom-dashboards': plan !== 'free' ? 0.48 : 0.05,
      'integrations': plan !== 'free' ? 0.52 : 0.08,
      'advanced-filters': completedOnboarding ? 0.42 : 0.12,
      'saved-views': completedOnboarding ? 0.38 : 0.10,
      'automation-rules': plan === 'enterprise' ? 0.65 : plan === 'growth' ? 0.30 : 0.03,
      'mobile-app': 0.22,
      'dark-mode': 0.35,
      'keyboard-shortcuts': 0.18,
      'sso-login': plan === 'enterprise' ? 0.88 : 0.03,
      '2fa': plan === 'enterprise' ? 0.92 : plan === 'growth' ? 0.45 : 0.12,
      'webhooks': ['enterprise', 'growth'].includes(plan) ? 0.48 : 0.02,
      'csv-import': 0.28,
      'goal-tracking': 0.32,
      'comment-threads': plan !== 'free' ? 0.42 : 0.08,
      'bulk-actions': completedOnboarding ? 0.25 : 0.05,
      'white-labeling': plan === 'enterprise' ? 0.72 : 0.01,
      'audit-log': plan === 'enterprise' ? 0.85 : 0.05,
    }

    // Sessions over time (capped to keep the dataset within free-tier storage)
    for (let s = 1; s <= Math.min(totalSessions, 4); s++) {
      const sessionDate = addDays(signupDate, Math.floor(s * daysSinceSignup / totalSessions))
      if (sessionDate > END_DATE) break
      const sessionId = `sess_${user.id}_${s}`

      eventBatches.push({
        userId: user.id,
        sessionId,
        eventName: 'session_start',
        eventCategory: 'engagement',
        properties: {},
        deviceType: pick(DEVICES),
        browser: pick(BROWSERS),
        country: user.country,
        receivedAt: sessionDate,
      })

      eventBatches.push({
        userId: user.id,
        sessionId,
        eventName: 'page_view',
        eventCategory: 'navigation',
        properties: { page: '/dashboard' },
        page: '/dashboard',
        deviceType: pick(DEVICES),
        browser: pick(BROWSERS),
        country: user.country,
        receivedAt: addSeconds(sessionDate, 2),
      })

      // Feature usage in this session
      for (const feature of featureRows) {
        const adoptionRate = featureAdoptionRates[feature.slug] ?? 0.15
        if (rand() < adoptionRate * 0.4) {
          const usageTime = addMinutes(sessionDate, Math.floor(rand() * 20))
          eventBatches.push({
            userId: user.id,
            sessionId,
            eventName: 'feature_use',
            eventCategory: 'engagement',
            properties: { feature: feature.slug, featureName: feature.name },
            deviceType: pick(DEVICES),
            browser: pick(BROWSERS),
            country: user.country,
            receivedAt: usageTime,
          })
        }
      }

      // Purchase / upgrade events
      if (plan !== 'free' && rand() < 0.002) {
        eventBatches.push({
          userId: user.id,
          sessionId,
          eventName: 'purchase',
          eventCategory: 'revenue',
          properties: {
            plan,
            amount: plan === 'starter' ? 29 : plan === 'growth' ? 99 : 399,
            currency: 'USD',
          },
          receivedAt: addMinutes(sessionDate, 5),
        })
      }
    }

    // Retention-checkpoint sessions — produce a realistic D1>D7>D30>D90 curve.
    // (Cheap: a handful of events per user, but anchors the retention windows.)
    const checkpoints = [1, 7, 14, 30, 60, 90]
    const retentionProb = isActive
      ? [0.62, 0.45, 0.38, 0.30, 0.22, 0.16]
      : [0.40, 0.18, 0.10, 0.05, 0.02, 0.01]
    for (let c = 0; c < checkpoints.length; c++) {
      const day = checkpoints[c]
      if (day > daysSinceSignup) break
      if (rand() >= retentionProb[c]) continue
      const checkpointDate = addDays(signupDate, day)
      if (checkpointDate > END_DATE) break
      eventBatches.push({
        userId: user.id,
        sessionId: `sess_${user.id}_ret_${day}`,
        eventName: 'session_start',
        eventCategory: 'engagement',
        properties: { retentionDay: day },
        deviceType: pick(DEVICES),
        browser: pick(BROWSERS),
        country: user.country,
        receivedAt: checkpointDate,
      })
    }

    // Login events
    if (isActive) {
      const loginCount = Math.floor(totalSessions * 0.8)
      for (let l = 0; l < Math.min(loginCount, 6); l++) {
        const loginDate = randomDateBetween(signupDate, lastSeen)
        eventBatches.push({
          userId: user.id,
          sessionId: `sess_${user.id}_login_${l}`,
          eventName: 'login',
          eventCategory: 'auth',
          properties: { method: rand() < 0.05 ? 'sso' : 'email' },
          receivedAt: loginDate,
        })
      }
    }
  }

  console.log(`Inserting ${eventBatches.length} events...`)
  for (let i = 0; i < eventBatches.length; i += 2000) {
    await db.insert(events).values(eventBatches.slice(i, i + 2000))
  }

  console.log('Seeding experiments...')
  const experimentData = [
    {
      name: 'Onboarding Simplification v2',
      description: 'Reduce onboarding steps from 5 to 3 to improve activation rate',
      hypothesis: 'Reducing friction in onboarding will increase D7 retention by 15%',
      status: 'completed',
      type: 'ab',
      variants: [
        { name: 'Control', description: '5-step onboarding', trafficPercent: 50 },
        { name: 'Treatment', description: '3-step onboarding', trafficPercent: 50 },
      ],
      primaryMetric: 'activation_rate',
      startedAt: new Date('2024-02-01'),
      endedAt: new Date('2024-02-28'),
    },
    {
      name: 'AI Search Beta',
      description: 'Surface AI-powered search to power users',
      hypothesis: 'AI search will increase search engagement and feature stickiness',
      status: 'completed',
      type: 'ab',
      variants: [
        { name: 'Control', description: 'Basic search', trafficPercent: 50 },
        { name: 'AI Search', description: 'AI-powered search', trafficPercent: 50 },
      ],
      primaryMetric: 'feature_engagement',
      startedAt: new Date('2024-03-15'),
      endedAt: new Date('2024-04-14'),
    },
    {
      name: 'Pricing Page Redesign',
      description: 'New pricing page with emphasis on value and social proof',
      hypothesis: 'A clearer value proposition will increase trial-to-paid conversion by 10%',
      status: 'completed',
      type: 'ab',
      variants: [
        { name: 'Control', description: 'Current pricing page', trafficPercent: 50 },
        { name: 'Value-led', description: 'ROI-focused pricing', trafficPercent: 50 },
      ],
      primaryMetric: 'trial_to_paid',
      startedAt: new Date('2024-04-01'),
      endedAt: new Date('2024-05-01'),
    },
    {
      name: 'Dashboard Widget Personalization',
      description: 'Let users customize their dashboard widget layout',
      hypothesis: 'Personalization increases DAU and session depth',
      status: 'completed',
      type: 'multivariate',
      variants: [
        { name: 'Control', description: 'Fixed layout', trafficPercent: 33 },
        { name: 'Drag-drop', description: 'Drag-drop customization', trafficPercent: 33 },
        { name: 'Template picker', description: 'Choose from templates', trafficPercent: 34 },
      ],
      primaryMetric: 'dau',
      startedAt: new Date('2024-05-15'),
      endedAt: new Date('2024-06-14'),
    },
    {
      name: 'Email Digest Frequency',
      description: 'Weekly vs daily digest for re-engagement',
      hypothesis: 'Weekly digests reduce unsubscribes while maintaining engagement',
      status: 'completed',
      type: 'ab',
      variants: [
        { name: 'Daily', description: 'Daily summary emails', trafficPercent: 50 },
        { name: 'Weekly', description: 'Weekly digest email', trafficPercent: 50 },
      ],
      primaryMetric: 'email_open_rate',
      startedAt: new Date('2024-06-01'),
      endedAt: new Date('2024-07-01'),
    },
    {
      name: 'In-App Upgrade Prompt Timing',
      description: 'Show upgrade prompt on 10th session vs 5th session',
      hypothesis: 'Later prompt shows higher intent and converts better',
      status: 'completed',
      type: 'ab',
      variants: [
        { name: 'Early (5th)', description: 'Prompt on 5th session', trafficPercent: 50 },
        { name: 'Late (10th)', description: 'Prompt on 10th session', trafficPercent: 50 },
      ],
      primaryMetric: 'upgrade_conversion',
      startedAt: new Date('2024-07-01'),
      endedAt: new Date('2024-08-01'),
    },
    {
      name: 'Team Invite Nudge',
      description: 'Proactive nudge to invite team members during onboarding',
      hypothesis: 'Teams with 3+ members have 4× higher retention',
      status: 'completed',
      type: 'ab',
      variants: [
        { name: 'Control', description: 'No nudge', trafficPercent: 50 },
        { name: 'Nudge', description: 'Prominent invite CTA', trafficPercent: 50 },
      ],
      primaryMetric: 'team_invite_rate',
      startedAt: new Date('2024-08-01'),
      endedAt: new Date('2024-09-01'),
    },
    {
      name: 'Mobile App Promotion Banner',
      description: 'Promote mobile app to desktop users',
      hypothesis: 'Cross-platform users have higher retention',
      status: 'running',
      type: 'ab',
      variants: [
        { name: 'Control', description: 'No banner', trafficPercent: 50 },
        { name: 'Banner', description: 'Mobile app download banner', trafficPercent: 50 },
      ],
      primaryMetric: 'mobile_install_rate',
      startedAt: new Date('2024-10-01'),
      endedAt: null,
    },
    {
      name: 'AI Recommendations on Dashboard',
      description: 'Show AI-generated insights on the main dashboard',
      hypothesis: 'Proactive insights drive deeper feature engagement',
      status: 'running',
      type: 'ab',
      variants: [
        { name: 'Control', description: 'Standard dashboard', trafficPercent: 50 },
        { name: 'AI Insights', description: 'Dashboard with AI insights widget', trafficPercent: 50 },
      ],
      primaryMetric: 'feature_depth',
      startedAt: new Date('2024-11-01'),
      endedAt: null,
    },
    {
      name: 'Freemium Limit: 3 vs 5 Reports',
      description: 'Test whether raising the free tier limit increases upgrade rate',
      hypothesis: 'More generous free tier increases trust and long-term upgrade rate',
      status: 'draft',
      type: 'ab',
      variants: [
        { name: '3 reports', description: 'Current 3-report limit', trafficPercent: 50 },
        { name: '5 reports', description: 'Generous 5-report limit', trafficPercent: 50 },
      ],
      primaryMetric: 'upgrade_rate_90d',
      startedAt: null,
      endedAt: null,
    },
  ]

  const insertedExperiments = await db.insert(experiments).values(experimentData).returning()

  // Experiment results
  const resultData = []
  const experimentResults2 = [
    { idx: 0, results: [
      { variant: 'Control', metric: 'activation_rate', sample: 2400, conversions: 960, lift: 0, pValue: 1.0, significant: false, verdict: 'control' },
      { variant: 'Treatment', metric: 'activation_rate', sample: 2400, conversions: 1272, lift: 32.5, pValue: 0.0001, significant: true, verdict: 'winner' },
    ]},
    { idx: 1, results: [
      { variant: 'Control', metric: 'feature_engagement', sample: 3000, conversions: 540, lift: 0, pValue: 1.0, significant: false, verdict: 'control' },
      { variant: 'AI Search', metric: 'feature_engagement', sample: 3000, conversions: 1008, lift: 86.7, pValue: 0.00001, significant: true, verdict: 'winner' },
    ]},
    { idx: 2, results: [
      { variant: 'Control', metric: 'trial_to_paid', sample: 1800, conversions: 216, lift: 0, pValue: 1.0, significant: false, verdict: 'control' },
      { variant: 'Value-led', metric: 'trial_to_paid', sample: 1800, conversions: 234, lift: 8.3, pValue: 0.09, significant: false, verdict: 'inconclusive' },
    ]},
    { idx: 3, results: [
      { variant: 'Control', metric: 'dau', sample: 2200, conversions: 880, lift: 0, pValue: 1.0, significant: false, verdict: 'control' },
      { variant: 'Drag-drop', metric: 'dau', sample: 2200, conversions: 1034, lift: 17.5, pValue: 0.002, significant: true, verdict: 'winner' },
      { variant: 'Template picker', metric: 'dau', sample: 2300, conversions: 944, lift: 7.3, pValue: 0.11, significant: false, verdict: 'inconclusive' },
    ]},
    { idx: 4, results: [
      { variant: 'Daily', metric: 'email_open_rate', sample: 3500, conversions: 980, lift: 0, pValue: 1.0, significant: false, verdict: 'control' },
      { variant: 'Weekly', metric: 'email_open_rate', sample: 3500, conversions: 1120, lift: 14.3, pValue: 0.003, significant: true, verdict: 'winner' },
    ]},
    { idx: 5, results: [
      { variant: 'Early (5th)', metric: 'upgrade_conversion', sample: 2800, conversions: 140, lift: 0, pValue: 1.0, significant: false, verdict: 'control' },
      { variant: 'Late (10th)', metric: 'upgrade_conversion', sample: 2800, conversions: 196, lift: 40.0, pValue: 0.00002, significant: true, verdict: 'winner' },
    ]},
    { idx: 6, results: [
      { variant: 'Control', metric: 'team_invite_rate', sample: 4000, conversions: 600, lift: 0, pValue: 1.0, significant: false, verdict: 'control' },
      { variant: 'Nudge', metric: 'team_invite_rate', sample: 4000, conversions: 1040, lift: 73.3, pValue: 0.00001, significant: true, verdict: 'winner' },
    ]},
    { idx: 7, results: [
      { variant: 'Control', metric: 'mobile_install_rate', sample: 5000, conversions: 450, lift: 0, pValue: 1.0, significant: false, verdict: 'running' },
      { variant: 'Banner', metric: 'mobile_install_rate', sample: 5000, conversions: 680, lift: 51.1, pValue: 0.001, significant: true, verdict: 'running' },
    ]},
    { idx: 8, results: [
      { variant: 'Control', metric: 'feature_depth', sample: 3200, conversions: 960, lift: 0, pValue: 1.0, significant: false, verdict: 'running' },
      { variant: 'AI Insights', metric: 'feature_depth', sample: 3200, conversions: 1088, lift: 13.3, pValue: 0.04, significant: true, verdict: 'running' },
    ]},
  ]

  for (const exp of experimentResults2) {
    const expId = insertedExperiments[exp.idx]?.id
    if (!expId) continue
    for (const r of exp.results) {
      resultData.push({
        experimentId: expId,
        variant: r.variant,
        metric: r.metric,
        sampleSize: r.sample,
        conversions: r.conversions,
        conversionRate: r.conversions / r.sample,
        liftPercent: r.lift,
        pValue: r.pValue,
        isSignificant: r.significant,
        verdict: r.verdict,
        confidenceInterval: [r.conversions / r.sample - 0.02, r.conversions / r.sample + 0.02] as [number, number],
      })
    }
  }

  await db.insert(experimentResults).values(resultData)

  console.log('Seeding opportunities...')
  const opportunityData = [
    {
      name: 'Build AI-Powered Search',
      type: 'high_demand_low_adoption',
      description: 'Experiment data shows AI Search increases engagement 87%. Free users have 10% adoption vs 45% for paid — huge conversion lever.',
      opportunityScore: 94,
      userImpact: 92,
      businessImpact: 96,
      confidenceScore: 87,
      evidence: ['AI Search experiment: +87% engagement', '35% of support tickets mention search', 'Top requested feature in NPS surveys'],
      affectedUsers: 7800,
      status: 'active',
    },
    {
      name: 'Simplify Onboarding (3-Step Flow)',
      type: 'high_churn_critical_feature',
      description: 'Onboarding experiment showed 32.5% activation lift. Only 55% of users complete the current 5-step flow. D30 retention for activated users is 3.2× higher.',
      opportunityScore: 91,
      userImpact: 88,
      businessImpact: 95,
      confidenceScore: 95,
      evidence: ['Onboarding experiment: +32.5% activation', 'D30 retention 3.2× higher for activated users', '45% drop-off at step 3'],
      affectedUsers: 9200,
      status: 'active',
    },
    {
      name: 'Team Collaboration Suite Expansion',
      type: 'high_usage_low_satisfaction',
      description: 'Team accounts have 4× higher retention. Team Collab feature adoption only 60% among Growth plan. Invite nudge experiment showed +73% invite rate.',
      opportunityScore: 88,
      userImpact: 85,
      businessImpact: 91,
      confidenceScore: 82,
      evidence: ['Team accounts: 4× retention', 'Invite nudge: +73% rate', 'Growth plan users: 40% have teams < 3'],
      affectedUsers: 4200,
      status: 'active',
    },
    {
      name: 'Mobile App Feature Parity',
      type: 'high_demand_low_adoption',
      description: 'Only 22% mobile adoption despite 38% of sessions from mobile devices. Mobile banner experiment shows 51% install lift with significance.',
      opportunityScore: 82,
      userImpact: 80,
      businessImpact: 83,
      confidenceScore: 74,
      evidence: ['38% traffic from mobile', '22% mobile app adoption', 'Mobile banner: +51% installs'],
      affectedUsers: 6100,
      status: 'active',
    },
    {
      name: 'Advanced Automation Rules',
      type: 'high_usage_low_satisfaction',
      description: 'Enterprise users with automation enabled have 65% lower churn. Only 30% of Growth users use automation vs 65% enterprise. Significant upsell lever.',
      opportunityScore: 79,
      userImpact: 74,
      businessImpact: 85,
      confidenceScore: 77,
      evidence: ['Automation users: 65% lower churn', '35% of churn mentions "manual work"', 'Growth→Enterprise upgrade driven by automation 42%'],
      affectedUsers: 2800,
      status: 'active',
    },
    {
      name: 'Free Tier Expansion (5 Reports)',
      type: 'growth_opportunity',
      description: 'Hypothesis: raising free limits drives trust and long-term upgrade rate. Test is not yet run — high strategic potential based on PLG benchmarks.',
      opportunityScore: 75,
      userImpact: 78,
      businessImpact: 70,
      confidenceScore: 58,
      evidence: ['PLG benchmark: 30% more reports → 18% higher conversion', 'Free users who hit limits: 35% churn instead of upgrade'],
      affectedUsers: 4500,
      status: 'active',
    },
    {
      name: 'Proactive AI Dashboard Insights',
      type: 'growth_opportunity',
      description: 'Running experiment shows +13% feature depth. Proactive recommendations reduce time-to-value and increase power user conversion.',
      opportunityScore: 71,
      userImpact: 73,
      businessImpact: 68,
      confidenceScore: 65,
      evidence: ['AI Dashboard experiment: +13% feature depth (running)', 'Power users report "lack of guidance" in NPS'],
      affectedUsers: 3200,
      status: 'active',
    },
    {
      name: 'Enterprise SSO & Security Suite',
      type: 'high_demand_low_adoption',
      description: 'SSO adoption 88% among enterprise but conversion from Growth blocked by missing SAML/SCIM. Security suite is top enterprise buying criterion.',
      opportunityScore: 68,
      userImpact: 55,
      businessImpact: 85,
      confidenceScore: 80,
      evidence: ['88% SSO adoption in enterprise', 'SCIM missing: 23% enterprise deals blocked', 'Security mentioned in 67% of enterprise RFPs'],
      affectedUsers: 800,
      status: 'active',
    },
  ]

  const insertedOpportunities = await db.insert(opportunities).values(opportunityData).returning()

  console.log('Seeding initiatives...')
  const initiativeData = [
    {
      name: 'Build AI Search',
      description: 'Implement AI-powered semantic search across all product data',
      opportunityId: insertedOpportunities[0].id,
      status: 'planned',
      reach: 7800,
      impact: 9.2,
      confidence: 87,
      effort: 3,
      riceScore: Math.round((7800 * 9.2 * 87) / 3),
      iceScore: Math.round((9.2 + 8.7 + 8.5) / 3 * 10),
      wsjfScore: 91,
      priorityScore: 91,
      strategicAlignment: 95,
      expectedRoi: 3.8,
      expectedRetentionLift: 11,
      expectedRevenueLift: 120000,
      engineeringCost: 6,
      recommendation: 'Ship AI Search to all paid plans. Experiment evidence is strong. High demand, proven engagement lift, clear upsell lever for free users.',
      quarter: 'Q1 2025',
      tags: ['ai', 'search', 'growth'],
    },
    {
      name: 'Streamlined 3-Step Onboarding',
      description: 'Redesign onboarding to 3 steps: connect data, invite team, see first insight',
      opportunityId: insertedOpportunities[1].id,
      status: 'in_progress',
      reach: 9200,
      impact: 9.5,
      confidence: 95,
      effort: 2,
      riceScore: Math.round((9200 * 9.5 * 95) / 2),
      iceScore: Math.round((9.5 + 9.5 + 8.8) / 3 * 10),
      wsjfScore: 96,
      priorityScore: 94,
      strategicAlignment: 98,
      expectedRoi: 4.2,
      expectedRetentionLift: 18,
      expectedRevenueLift: 185000,
      engineeringCost: 3,
      recommendation: 'Highest-confidence initiative. Ship this quarter. 95% confidence from experiment, 18% retention lift expected.',
      quarter: 'Q1 2025',
      tags: ['onboarding', 'retention', 'activation'],
    },
    {
      name: 'Team Collaboration v2',
      description: 'Real-time collaboration: shared views, comment threads, activity feeds',
      opportunityId: insertedOpportunities[2].id,
      status: 'planned',
      reach: 4200,
      impact: 8.5,
      confidence: 82,
      effort: 5,
      riceScore: Math.round((4200 * 8.5 * 82) / 5),
      iceScore: Math.round((8.5 + 8.2 + 7.8) / 3 * 10),
      wsjfScore: 84,
      priorityScore: 88,
      strategicAlignment: 90,
      expectedRoi: 2.8,
      expectedRetentionLift: 22,
      expectedRevenueLift: 95000,
      engineeringCost: 8,
      recommendation: 'High retention impact for team accounts. Schedule Q2 after onboarding ships.',
      quarter: 'Q2 2025',
      tags: ['collaboration', 'retention', 'enterprise'],
    },
    {
      name: 'Mobile App Redesign',
      description: 'Full mobile app rebuild with feature parity to web',
      opportunityId: insertedOpportunities[3].id,
      status: 'backlog',
      reach: 6100,
      impact: 7.8,
      confidence: 74,
      effort: 8,
      riceScore: Math.round((6100 * 7.8 * 74) / 8),
      iceScore: Math.round((7.8 + 7.4 + 7.2) / 3 * 10),
      wsjfScore: 72,
      priorityScore: 79,
      strategicAlignment: 78,
      expectedRoi: 2.1,
      expectedRetentionLift: 9,
      expectedRevenueLift: 68000,
      engineeringCost: 13,
      recommendation: 'High user demand but large engineering cost. Consider mobile-first features first. Schedule Q3.',
      quarter: 'Q3 2025',
      tags: ['mobile', 'engagement'],
    },
    {
      name: 'Automation Rules Engine',
      description: 'Visual automation builder: triggers, conditions, and actions',
      opportunityId: insertedOpportunities[4].id,
      status: 'backlog',
      reach: 2800,
      impact: 8.5,
      confidence: 77,
      effort: 6,
      riceScore: Math.round((2800 * 8.5 * 77) / 6),
      iceScore: Math.round((8.5 + 7.7 + 8.8) / 3 * 10),
      wsjfScore: 76,
      priorityScore: 81,
      strategicAlignment: 85,
      expectedRoi: 3.1,
      expectedRetentionLift: 15,
      expectedRevenueLift: 88000,
      engineeringCost: 10,
      recommendation: 'Strong enterprise retention driver. Unlock Growth→Enterprise upgrades. Q2 after Collab.',
      quarter: 'Q2 2025',
      tags: ['automation', 'enterprise', 'retention'],
    },
    {
      name: 'Enterprise Security Suite (SAML + SCIM)',
      description: 'SSO via SAML 2.0, SCIM provisioning, IP allowlisting, audit logs',
      opportunityId: insertedOpportunities[7].id,
      status: 'planned',
      reach: 800,
      impact: 9.8,
      confidence: 80,
      effort: 4,
      riceScore: Math.round((800 * 9.8 * 80) / 4),
      iceScore: Math.round((9.8 + 8.0 + 9.2) / 3 * 10),
      wsjfScore: 78,
      priorityScore: 82,
      strategicAlignment: 92,
      expectedRoi: 5.2,
      expectedRetentionLift: 8,
      expectedRevenueLift: 145000,
      engineeringCost: 6,
      recommendation: 'Essential for enterprise deals. 23% of pipeline blocked without this. High ROI despite small user count.',
      quarter: 'Q1 2025',
      tags: ['security', 'enterprise', 'compliance'],
    },
  ]

  const insertedInitiatives = await db.insert(initiatives).values(initiativeData).returning()

  console.log('Seeding roadmap...')
  const roadmapData = [
    { name: 'Streamlined 3-Step Onboarding', quarter: 'Q1 2025', status: 'in_progress', priority: 1, estimatedWeeks: 4, initiativeId: insertedInitiatives[1].id, expectedOutcome: '+18% D30 retention, +32% activation rate' },
    { name: 'Build AI Search', quarter: 'Q1 2025', status: 'planned', priority: 2, estimatedWeeks: 6, initiativeId: insertedInitiatives[0].id, expectedOutcome: '+11% retention, $120k ARR, +87% search engagement' },
    { name: 'Enterprise SAML + SCIM', quarter: 'Q1 2025', status: 'planned', priority: 3, estimatedWeeks: 4, initiativeId: insertedInitiatives[5].id, expectedOutcome: 'Unblock 23% of enterprise pipeline, $145k ARR' },
    { name: 'Team Collaboration v2', quarter: 'Q2 2025', status: 'planned', priority: 1, estimatedWeeks: 8, initiativeId: insertedInitiatives[2].id, expectedOutcome: '+22% team retention, $95k ARR' },
    { name: 'Automation Rules Engine', quarter: 'Q2 2025', status: 'planned', priority: 2, estimatedWeeks: 10, initiativeId: insertedInitiatives[4].id, expectedOutcome: '+15% retention, unlock Growth→Enterprise upgrades' },
    { name: 'Free Tier Expansion (5 Reports)', quarter: 'Q2 2025', status: 'planned', priority: 3, estimatedWeeks: 2, dependencies: ['Onboarding'], expectedOutcome: 'Higher free→paid conversion rate' },
    { name: 'Mobile App Redesign', quarter: 'Q3 2025', status: 'planned', priority: 1, estimatedWeeks: 13, initiativeId: insertedInitiatives[3].id, expectedOutcome: '+9% retention, $68k ARR' },
    { name: 'AI Dashboard Insights', quarter: 'Q3 2025', status: 'planned', priority: 2, estimatedWeeks: 6, expectedOutcome: '+13% feature depth, higher power user conversion' },
    { name: 'API v2 & Webhooks', quarter: 'Q4 2025', status: 'planned', priority: 1, estimatedWeeks: 8, expectedOutcome: 'Developer ecosystem expansion, partner integrations' },
    { name: 'White-Label Enterprise Mode', quarter: 'Q4 2025', status: 'planned', priority: 2, estimatedWeeks: 6, expectedOutcome: 'Agency and reseller market entry' },
  ]

  await db.insert(roadmapItems).values(roadmapData)

  console.log('Seeding goals...')
  await db.insert(goals).values([
    { name: 'Monthly Active Users', type: 'growth', targetValue: 12000, currentValue: 8743, unit: 'users', quarter: 'Q1 2025', status: 'on_track' },
    { name: 'D30 Retention Rate', type: 'retention', targetValue: 55, currentValue: 48.2, unit: '%', quarter: 'Q1 2025', status: 'at_risk' },
    { name: 'Trial-to-Paid Conversion', type: 'revenue', targetValue: 15, currentValue: 12.8, unit: '%', quarter: 'Q1 2025', status: 'on_track' },
    { name: 'Net Revenue Retention', type: 'revenue', targetValue: 115, currentValue: 108, unit: '%', quarter: 'Q1 2025', status: 'at_risk' },
    { name: 'Activation Rate', type: 'activation', targetValue: 75, currentValue: 67.3, unit: '%', quarter: 'Q1 2025', status: 'on_track' },
    { name: 'NPS Score', type: 'satisfaction', targetValue: 50, currentValue: 42, unit: 'points', quarter: 'Q1 2025', status: 'on_track' },
  ])

  console.log('Seed complete!')
  return { users: insertedUsers.length, events: eventBatches.length }
}

function addSeconds(date: Date, seconds: number): Date {
  const d = new Date(date)
  d.setSeconds(d.getSeconds() + seconds)
  return d
}
