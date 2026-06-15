import { getDb } from '../db'
import { opportunities, initiatives } from '../db/schema'
import { desc, eq } from 'drizzle-orm'
import { calculateOpportunityScore } from './statistics'

export interface OpportunityWithInitiatives {
  id: string
  name: string
  type: string
  description: string
  opportunityScore: number
  userImpact: number
  businessImpact: number
  confidenceScore: number
  evidence: string[]
  affectedUsers: number
  status: string
  initiatives: Array<{
    id: string
    name: string
    priorityScore: number
    status: string
  }>
}

export const OPPORTUNITY_TYPES = {
  high_demand_low_adoption: {
    label: 'High Demand, Low Adoption',
    color: '#f59e0b',
    description: 'Users want this but aren\'t using it',
  },
  high_churn_critical_feature: {
    label: 'High Churn Risk',
    color: '#ef4444',
    description: 'Critical feature tied to churn behavior',
  },
  high_usage_low_satisfaction: {
    label: 'High Usage, Low Satisfaction',
    color: '#8b5cf6',
    description: 'Used heavily but users are unhappy',
  },
  growth_opportunity: {
    label: 'Growth Opportunity',
    color: '#10b981',
    description: 'Untapped growth lever identified',
  },
  retention_risk: {
    label: 'Retention Risk',
    color: '#f97316',
    description: 'Behavioral signals indicate pending churn',
  },
}

export async function getAllOpportunities(): Promise<OpportunityWithInitiatives[]> {
  const db = getDb()
  const opps = await db.select().from(opportunities)
    .orderBy(desc(opportunities.opportunityScore))

  const allInitiatives = await db.select({
    id: initiatives.id,
    name: initiatives.name,
    priorityScore: initiatives.priorityScore,
    status: initiatives.status,
    opportunityId: initiatives.opportunityId,
  }).from(initiatives)

  return opps.map(opp => ({
    id: opp.id,
    name: opp.name,
    type: opp.type,
    description: opp.description ?? '',
    opportunityScore: opp.opportunityScore ?? 0,
    userImpact: opp.userImpact ?? 0,
    businessImpact: opp.businessImpact ?? 0,
    confidenceScore: opp.confidenceScore ?? 0,
    evidence: (opp.evidence as string[]) ?? [],
    affectedUsers: opp.affectedUsers ?? 0,
    status: opp.status ?? 'active',
    initiatives: allInitiatives
      .filter(i => i.opportunityId === opp.id)
      .map(i => ({
        id: i.id,
        name: i.name,
        priorityScore: i.priorityScore ?? 0,
        status: i.status ?? 'backlog',
      })),
  }))
}

export async function getOpportunitySummary() {
  const db = getDb()
  const opps = await db.select().from(opportunities)
  return {
    total: opps.length,
    active: opps.filter(o => o.status === 'active').length,
    highPriority: opps.filter(o => (o.opportunityScore ?? 0) >= 80).length,
    avgScore: opps.length > 0
      ? Math.round(opps.reduce((s, o) => s + (o.opportunityScore ?? 0), 0) / opps.length)
      : 0,
    totalAffectedUsers: opps.reduce((s, o) => s + (o.affectedUsers ?? 0), 0),
  }
}
