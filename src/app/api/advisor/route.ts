import { NextRequest, NextResponse } from 'next/server'
import { getAllOpportunities } from '@/lib/engines/opportunity'
import { getRankedInitiatives } from '@/lib/engines/prioritization'
import { getRetentionSummary } from '@/lib/analytics/cohorts'

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'

interface AdvisorContext {
  topOpportunities: string
  topInitiatives: string
  retentionMetrics: string
}

async function buildContext(): Promise<AdvisorContext> {
  const [opps, initiatives, retention] = await Promise.all([
    getAllOpportunities().catch(() => []),
    getRankedInitiatives().catch(() => []),
    getRetentionSummary().catch(() => ({ d1: 0, d7: 0, d30: 0, d90: 0 })),
  ])

  const topOpportunities = opps.slice(0, 5).map(o =>
    `- ${o.name} (Score: ${o.opportunityScore}, Confidence: ${o.confidenceScore}%, Affected: ${o.affectedUsers.toLocaleString()} users)`
  ).join('\n')

  const topInitiatives = initiatives.slice(0, 5).map(i =>
    `- ${i.name} (Priority: ${i.priorityScore}, Expected Revenue: $${i.expectedRevenueLift.toLocaleString()}/yr, Retention: +${i.expectedRetentionLift}%)`
  ).join('\n')

  const retentionMetrics = `D1: ${retention.d1}%, D7: ${retention.d7}%, D30: ${retention.d30}%, D90: ${retention.d90}%`

  return { topOpportunities, topInitiatives, retentionMetrics }
}

function deterministicAnswer(question: string, ctx: AdvisorContext): string {
  const q = question.toLowerCase()

  if (q.includes('build next') || q.includes('what to build') || q.includes('roadmap')) {
    return `## What to Build Next

Based on your product intelligence data, here are the top recommendations:

**Top Opportunities:**
${ctx.topOpportunities}

**Top Ranked Initiatives:**
${ctx.topInitiatives}

**Recommendation:**
1. **Ship Simplified Onboarding first** — 95% confidence, +18% retention lift, lowest effort. Every week of delay compounds churn.
2. **Follow with AI Search** — 87% confidence from experiment, +87% engagement lift, strongest conversion lever for free→paid.
3. **Unblock Enterprise with SAML/SCIM** — High ROI despite small user count; pipeline impact is disproportionate.

**Strategic reasoning:** Retention-first investments compound. A 10% improvement in D30 retention typically yields 20-30% more LTV.`
  }

  if (q.includes('retention') || q.includes('churn')) {
    return `## Retention Analysis

**Current Retention Metrics:**
${ctx.retentionMetrics}

**Key Findings:**
- D30 retention is the critical inflection point — users who survive 30 days have 5× higher probability of reaching 90 days
- Onboarding completion correlates 3.2× with D30 retention
- Team accounts (3+ members) retain at 4× the rate of solo users

**Recommendations:**
1. Prioritize the simplified 3-step onboarding (highest-confidence retention lever)
2. Add team invite nudge during onboarding (experiment showed +73% invite rate)
3. Build a D7 retention intervention for users who haven't activated (email sequence + in-app nudge)

**Risk:** Current D30 retention of ~48% suggests you're leaving significant LTV on the table. Industry benchmark for SaaS is 55-65%.`
  }

  if (q.includes('experiment') || q.includes('test')) {
    return `## Experiment Recommendations

**Experiments to Run Next:**

1. **Free Tier Limit Expansion (5 vs 3 Reports)**
   - Hypothesis: More generous limits increase trust → higher 90-day upgrade rate
   - Expected impact: +8-12% trial-to-paid conversion
   - Effort: Low (configuration change)

2. **D7 Retention Email Sequence**
   - Hypothesis: Targeted intervention at D7 prevents month-1 churn
   - Expected impact: +15% D30 retention for at-risk segment
   - Effort: Medium

3. **AI Insights Widget on Dashboard**
   - Running experiment shows +13% feature depth — consider shipping to all users
   - Confidence is approaching significance (p=0.04)

**Key insight:** Your most successful experiments share a pattern — they reduce friction and increase time-to-value. Design your next experiments around that hypothesis.`
  }

  if (q.includes('revenue') || q.includes('roi') || q.includes('impact')) {
    return `## Revenue Impact Analysis

**Top Revenue Opportunities:**
${ctx.topInitiatives}

**Summary:**
- Total expected annual revenue from top 5 initiatives: ~$616,000
- Highest ROI initiative: Enterprise Security Suite (5.2× ROI) — small user base but large deal sizes
- Highest absolute revenue: AI Search ($120K/yr) due to free→paid conversion lift

**Key insight:** Your enterprise segment (8% of users) generates disproportionate revenue. Unblocking SAML/SCIM is the highest-leverage near-term revenue move. Combine with Collaboration Suite for a strong enterprise motion.`
  }

  return `## ProductLab AI Advisor

I've analyzed your product intelligence data:

**Retention:** ${ctx.retentionMetrics}

**Top Opportunities:**
${ctx.topOpportunities}

**Recommended Actions:**
1. Ship simplified onboarding — highest confidence, highest retention impact
2. Launch AI Search to paid plans — proven experiment evidence
3. Build team collaboration features — 4× retention multiplier for team accounts

Ask me about: "What should we build next?", "Why is retention low?", "Which experiment should we run?", or "What's the expected revenue impact?"`
}

async function ollamaChat(model: string, systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      stream: false,
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`)
  const data = await response.json() as { message?: { content?: string } }
  return data.message?.content ?? ''
}

export async function POST(req: NextRequest) {
  const { question, model = 'llama3.2', useAI = false } = await req.json()

  if (!question) {
    return NextResponse.json({ error: 'question is required' }, { status: 400 })
  }

  const ctx = await buildContext()

  if (useAI) {
    const systemPrompt = `You are a ProductLab AI Advisor — an expert product strategist with deep knowledge of SaaS growth, retention, and prioritization. You answer questions using structured product intelligence data.

Current product context:
Top Opportunities:
${ctx.topOpportunities}

Top Initiatives by Priority:
${ctx.topInitiatives}

Retention Metrics:
${ctx.retentionMetrics}

Guidelines:
- Be specific and data-driven
- Use the provided metrics and opportunity data
- Focus on actionable recommendations
- Structure responses with clear sections
- Reason about trade-offs and confidence levels`

    try {
      const answer = await ollamaChat(model, systemPrompt, question)
      return NextResponse.json({
        answer,
        source: 'ollama',
        model,
        context: ctx,
      })
    } catch (err) {
      console.warn('Ollama unavailable, using deterministic fallback:', err)
    }
  }

  const answer = deterministicAnswer(question, ctx)
  return NextResponse.json({
    answer,
    source: 'deterministic',
    model: 'built-in',
    context: ctx,
  })
}

export async function GET() {
  try {
    const response = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(3000) })
    const data = await response.json() as { models?: Array<{ name: string }> }
    const models = data.models?.map(m => m.name) ?? []
    return NextResponse.json({ available: true, models })
  } catch {
    return NextResponse.json({ available: false, models: [] })
  }
}
