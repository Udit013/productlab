"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "./dashboard-layout"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp, TrendingDown, Target, Zap, AlertTriangle, FlaskConical,
  DollarSign, Users, ArrowRight, Star, RefreshCw, CheckCircle2, Clock,
  BarChart3, Map, Sparkles
} from "lucide-react"
import { formatCurrency, formatNumber, formatPercent, scoreBadgeColor, statusColor, cn } from "@/lib/utils"
import Link from "next/link"

interface Initiative {
  id: string
  name: string
  priorityScore: number
  expectedRetentionLift: number
  expectedRevenueLift: number
  expectedRoi: number
  confidence: number
  engineeringCost: number
  status: string
  recommendation: string | null
  tags: string[]
  quarter: string | null
  strategicAlignment: number
}

interface Opportunity {
  id: string
  name: string
  type: string
  opportunityScore: number
  userImpact: number
  businessImpact: number
  confidenceScore: number
  affectedUsers: number
  description: string
}

interface Goal {
  id: string
  name: string
  type: string
  targetValue: number
  currentValue: number
  unit: string
  status: string
}

const OPPORTUNITY_TYPE_LABELS: Record<string, string> = {
  high_demand_low_adoption: 'High Demand',
  high_churn_critical_feature: 'Churn Risk',
  high_usage_low_satisfaction: 'Satisfaction Gap',
  growth_opportunity: 'Growth',
  retention_risk: 'Retention Risk',
}

const OPPORTUNITY_TYPE_COLORS: Record<string, string> = {
  high_demand_low_adoption: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  high_churn_critical_feature: 'bg-red-500/15 text-red-300 border-red-500/30',
  high_usage_low_satisfaction: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  growth_opportunity: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  retention_risk: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
}

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : score >= 50 ? '#f97316' : '#ef4444'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#232d3d" strokeWidth={4} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-sm font-bold" style={{ color }}>{score}</span>
    </div>
  )
}

export default function DecisionCenter() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [retention, setRetention] = useState({ d1: 0, d7: 0, d30: 0, d90: 0 })
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [dbStatus, setDbStatus] = useState<{ users: number; events: number } | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      const [priRes, oppRes, goalRes, retRes] = await Promise.all([
        fetch('/api/prioritization?model=priority'),
        fetch('/api/opportunities'),
        fetch('/api/goals'),
        fetch('/api/analytics/cohorts?action=summary'),
      ])
      if (priRes.ok) {
        const { initiatives } = await priRes.json()
        setInitiatives(initiatives)
      }
      if (oppRes.ok) {
        const { opportunities } = await oppRes.json()
        setOpportunities(opportunities)
      }
      if (goalRes.ok) setGoals(await goalRes.json())
      if (retRes.ok) setRetention(await retRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function checkDb() {
    try {
      const res = await fetch('/api/demo')
      if (res.ok) setDbStatus(await res.json())
    } catch { /* ignore */ }
  }

  async function seedDemo() {
    setSeeding(true)
    try {
      await fetch('/api/demo', { method: 'POST' })
      await loadData()
      await checkDb()
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => {
    checkDb()
    loadData()
  }, [])

  const top5 = initiatives.slice(0, 5)
  const topOpps = opportunities.slice(0, 4)
  const totalRevenueLift = top5.reduce((s, i) => s + i.expectedRevenueLift, 0)
  const avgConfidence = top5.length > 0 ? Math.round(top5.reduce((s, i) => s + i.confidence, 0) / top5.length) : 0

  return (
    <DashboardLayout>
      <Topbar
        title="Decision Center"
        subtitle="Product intelligence → strategic decisions"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button size="sm" onClick={seedDemo} disabled={seeding} variant="secondary">
              <Sparkles className="h-3.5 w-3.5" />
              {seeding ? 'Loading Demo...' : 'Load Demo Data'}
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* DB status banner */}
        {dbStatus && dbStatus.users === 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/15 p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-300">No data loaded yet</p>
              <p className="text-xs text-amber-600">Click "Load Demo Data" to populate 10,000 users and 100K+ events</p>
            </div>
            <Button size="sm" onClick={seedDemo} disabled={seeding}>
              {seeding ? 'Loading...' : 'Load Demo Data'}
            </Button>
          </div>
        )}

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Expected Annual Revenue',
              value: formatCurrency(totalRevenueLift),
              sub: 'from top 5 initiatives',
              icon: DollarSign,
              color: 'text-emerald-600',
              bg: 'bg-emerald-500/15',
            },
            {
              label: 'D30 Retention',
              value: formatPercent(retention.d30),
              sub: 'industry benchmark: 55%',
              icon: Users,
              color: retention.d30 >= 55 ? 'text-emerald-600' : 'text-amber-600',
              bg: retention.d30 >= 55 ? 'bg-emerald-500/15' : 'bg-amber-500/15',
            },
            {
              label: 'Avg Confidence',
              value: `${avgConfidence}%`,
              sub: 'across top initiatives',
              icon: CheckCircle2,
              color: 'text-accent',
              bg: 'bg-accent/10',
            },
            {
              label: 'Active Opportunities',
              value: String(opportunities.filter(o => o.opportunityScore >= 70).length),
              sub: 'high-priority signals',
              icon: Target,
              color: 'text-violet-600',
              bg: 'bg-violet-500/15',
            },
          ].map((kpi) => {
            const Icon = kpi.icon
            return (
              <Card key={kpi.label} className="border-line">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted font-medium">{kpi.label}</p>
                      <p className="text-2xl font-bold text-ink mt-1">{kpi.value}</p>
                      <p className="text-xs text-faint mt-0.5">{kpi.sub}</p>
                    </div>
                    <div className={cn("rounded-lg p-2", kpi.bg)}>
                      <Icon className={cn("h-5 w-5", kpi.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Priority Recommendations */}
          <div className="xl:col-span-2">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-accent" />
                      Ranked Initiatives
                    </CardTitle>
                    <p className="text-xs text-muted mt-1">Sorted by Priority Score · Powered by RICE + ICE + WSJF</p>
                  </div>
                  <Link href="/prioritization">
                    <Button variant="ghost" size="sm">
                      View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center text-faint">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading intelligence...
                  </div>
                ) : top5.length === 0 ? (
                  <div className="p-8 text-center text-faint">
                    <p className="text-sm">No initiatives yet.</p>
                    <p className="text-xs mt-1">Load demo data to see recommendations.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-line">
                    {top5.map((initiative, idx) => (
                      <div key={initiative.id} className="p-4 hover:bg-surface-2 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 flex flex-col items-center gap-1">
                            <span className="text-xs font-bold text-faint">#{idx + 1}</span>
                            <ScoreRing score={initiative.priorityScore} size={52} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold text-ink text-sm">{initiative.name}</h3>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", statusColor(initiative.status))}>
                                    {initiative.status.replace('_', ' ')}
                                  </span>
                                  {initiative.quarter && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-muted border border-line">
                                      {initiative.quarter}
                                    </span>
                                  )}
                                  {(initiative.tags as string[]).slice(0, 2).map(t => (
                                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/25">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold text-emerald-600">{formatCurrency(initiative.expectedRevenueLift)}<span className="text-xs font-normal text-faint">/yr</span></p>
                                <p className="text-xs text-muted">+{initiative.expectedRetentionLift}% retention</p>
                              </div>
                            </div>
                            {initiative.recommendation && (
                              <p className="text-xs text-muted mt-2 line-clamp-2">{initiative.recommendation}</p>
                            )}
                            <div className="grid grid-cols-4 gap-3 mt-3">
                              {[
                                { label: 'Confidence', value: `${initiative.confidence}%` },
                                { label: 'ROI', value: `${initiative.expectedRoi}×` },
                                { label: 'Effort', value: `${initiative.engineeringCost}w` },
                                { label: 'Alignment', value: `${initiative.strategicAlignment}%` },
                              ].map(m => (
                                <div key={m.label} className="rounded-lg bg-surface-2 p-2 text-center">
                                  <p className="text-xs font-bold text-ink">{m.value}</p>
                                  <p className="text-[10px] text-faint">{m.label}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Goals */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4 text-accent" />
                  Q1 2025 Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {goals.slice(0, 5).map(goal => (
                  <div key={goal.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ink-2 font-medium">{goal.name}</span>
                      <span className="text-muted">
                        {goal.currentValue}{goal.unit === '%' ? '%' : ''} / {goal.targetValue}{goal.unit === '%' ? '%' : ''}
                      </span>
                    </div>
                    <div className="relative">
                      <Progress
                        value={(goal.currentValue / goal.targetValue) * 100}
                        className="h-1.5"
                        indicatorClassName={
                          goal.status === 'on_track' ? 'bg-emerald-500' :
                            goal.status === 'at_risk' ? 'bg-amber-500' : 'bg-red-500'
                        }
                      />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className={cn("text-[10px] font-medium",
                        goal.status === 'on_track' ? 'text-emerald-600' :
                          goal.status === 'at_risk' ? 'text-amber-600' : 'text-red-600'
                      )}>
                        {goal.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-faint">
                        {Math.round((goal.currentValue / goal.targetValue) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Top Opportunities
                  </CardTitle>
                  <Link href="/opportunities">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      View All <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {topOpps.map(opp => (
                  <div key={opp.id} className="rounded-lg border border-line p-3 hover:border-line-2 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-ink truncate">{opp.name}</p>
                        <span className={cn("inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded border font-medium",
                          OPPORTUNITY_TYPE_COLORS[opp.type])}>
                          {OPPORTUNITY_TYPE_LABELS[opp.type] ?? opp.type}
                        </span>
                      </div>
                      <ScoreRing score={opp.opportunityScore} size={40} />
                    </div>
                    <div className="flex gap-3 mt-2">
                      <div className="text-[10px] text-muted">
                        <span className="font-medium text-ink-2">{formatNumber(opp.affectedUsers)}</span> users
                      </div>
                      <div className="text-[10px] text-muted">
                        <span className="font-medium text-ink-2">{opp.confidenceScore}%</span> confidence
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Retention */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  Retention Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'D1', value: retention.d1, benchmark: 70 },
                    { label: 'D7', value: retention.d7, benchmark: 40 },
                    { label: 'D30', value: retention.d30, benchmark: 25 },
                    { label: 'D90', value: retention.d90, benchmark: 15 },
                  ].map(r => (
                    <div key={r.label} className="rounded-lg bg-surface-2 p-3 text-center">
                      <p className="text-lg font-bold text-ink">{r.value.toFixed(1)}%</p>
                      <p className="text-xs text-muted">{r.label} Retention</p>
                      <p className={cn("text-[10px] font-medium mt-0.5",
                        r.value >= r.benchmark ? 'text-emerald-600' : 'text-amber-600'
                      )}>
                        {r.value >= r.benchmark ? '↑ above benchmark' : `↓ below ${r.benchmark}%`}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: '/experiments', icon: FlaskConical, label: 'Experiments', desc: 'A/B tests & results', color: 'text-violet-600', bg: 'bg-violet-500/15' },
            { href: '/analytics/funnels', icon: TrendingUp, label: 'Funnels', desc: 'Conversion analysis', color: 'text-blue-600', bg: 'bg-blue-500/15' },
            { href: '/roadmap', icon: Map, label: 'Roadmap', desc: 'Quarterly planning', color: 'text-emerald-600', bg: 'bg-emerald-500/15' },
            { href: '/advisor', icon: Sparkles, label: 'AI Advisor', desc: 'Strategy questions', color: 'text-accent', bg: 'bg-accent/10' },
          ].map(item => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <Card className="hover:border-accent/30 hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn("rounded-lg p-2.5 transition-transform group-hover:scale-110", item.bg)}>
                      <Icon className={cn("h-5 w-5", item.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{item.label}</p>
                      <p className="text-xs text-muted">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
