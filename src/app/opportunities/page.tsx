"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "../dashboard-layout"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Target, Users, TrendingUp, Zap, ChevronDown, ChevronRight } from "lucide-react"
import { formatNumber, cn } from "@/lib/utils"

interface Opportunity {
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
  initiatives: Array<{ id: string; name: string; priorityScore: number; status: string }>
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  high_demand_low_adoption: { label: 'High Demand', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30', icon: '🔥' },
  high_churn_critical_feature: { label: 'Churn Risk', color: 'bg-red-500/15 text-red-300 border-red-500/30', icon: '⚠️' },
  high_usage_low_satisfaction: { label: 'Satisfaction Gap', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30', icon: '😤' },
  growth_opportunity: { label: 'Growth', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: '🚀' },
  retention_risk: { label: 'Retention Risk', color: 'bg-orange-500/15 text-orange-300 border-orange-500/30', icon: '📉' },
}

function ScoreBar({ value, label, color = 'bg-accent' }: { value: number; label: string; color?: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted">{label}</span>
        <span className="font-semibold text-ink">{value}</span>
      </div>
      <Progress value={value} className="h-1.5" indicatorClassName={color} />
    </div>
  )
}

function OpportunityCard({ opp }: { opp: Opportunity }) {
  const [expanded, setExpanded] = useState(false)
  const config = TYPE_CONFIG[opp.type] ?? { label: opp.type, color: 'bg-surface-2 text-muted border-line', icon: '📊' }
  const scoreColor = opp.opportunityScore >= 85 ? '#10b981' : opp.opportunityScore >= 70 ? '#f59e0b' : '#f97316'

  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Score circle */}
          <div className="flex-shrink-0 w-14 h-14 rounded-full border-4 flex items-center justify-center"
            style={{ borderColor: scoreColor }}>
            <span className="text-base font-bold" style={{ color: scoreColor }}>{opp.opportunityScore}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-ink">{opp.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", config.color)}>
                    {config.icon} {config.label}
                  </span>
                  <span className="text-xs text-muted flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {formatNumber(opp.affectedUsers)} users affected
                  </span>
                </div>
              </div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-faint hover:text-muted transition-colors"
              >
                {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
            </div>

            <p className="text-sm text-muted mt-2 line-clamp-2">{opp.description}</p>

            <div className="grid grid-cols-3 gap-3 mt-3">
              <ScoreBar value={opp.userImpact} label="User Impact" color="bg-blue-500" />
              <ScoreBar value={opp.businessImpact} label="Business Impact" color="bg-emerald-500" />
              <ScoreBar value={opp.confidenceScore} label="Confidence" color="bg-accent" />
            </div>

            {expanded && (
              <div className="mt-4 space-y-3 border-t border-line pt-4">
                {opp.evidence.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-ink-2 mb-2">Supporting Evidence</p>
                    <ul className="space-y-1">
                      {opp.evidence.map((e, i) => (
                        <li key={i} className="text-xs text-muted flex items-start gap-1.5">
                          <span className="text-emerald-500 mt-0.5">✓</span>
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {opp.initiatives.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-ink-2 mb-2">Linked Initiatives</p>
                    {opp.initiatives.map(init => (
                      <div key={init.id} className="flex items-center justify-between py-1.5 border-b border-line last:border-0">
                        <span className="text-xs text-ink-2">{init.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-accent">{init.priorityScore}</span>
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded border",
                            init.status === 'in_progress' ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' :
                              init.status === 'planned' ? 'bg-violet-500/15 text-violet-300 border-violet-500/30' :
                                'bg-surface-2 text-muted border-line'
                          )}>
                            {init.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function OpportunitiesPage() {
  const [data, setData] = useState<{ opportunities: Opportunity[]; summary: Record<string, number> } | null>(null)

  useEffect(() => {
    fetch('/api/opportunities').then(r => r.json()).then(setData)
  }, [])

  const opps = data?.opportunities ?? []
  const summary = data?.summary

  return (
    <DashboardLayout>
      <Topbar
        title="Opportunity Engine"
        subtitle="Automatically discovered product opportunities from behavioral data"
      />
      <div className="p-6 space-y-6">
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Opportunities', value: summary.total, icon: Target, color: 'text-accent', bg: 'bg-accent/10' },
              { label: 'High Priority (80+)', value: summary.highPriority, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-500/15' },
              { label: 'Avg Score', value: summary.avgScore, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-500/15' },
              { label: 'Users Affected', value: formatNumber(summary.totalAffectedUsers), icon: Users, color: 'text-violet-600', bg: 'bg-violet-500/15' },
            ].map(m => {
              const Icon = m.icon
              return (
                <Card key={m.label}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn("rounded-lg p-2.5", m.bg)}>
                      <Icon className={cn("h-5 w-5", m.color)} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-ink">{m.value}</p>
                      <p className="text-xs text-muted">{m.label}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-ink-2 uppercase tracking-wide">
            Opportunities · Ranked by Score
          </h2>
          {opps.length === 0 ? (
            <div className="text-center py-12 text-faint">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No opportunities found. Load demo data from the Decision Center.</p>
            </div>
          ) : (
            opps.map(opp => <OpportunityCard key={opp.id} opp={opp} />)
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
