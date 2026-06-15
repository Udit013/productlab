"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "../dashboard-layout"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FlaskConical, TrendingUp, CheckCircle, XCircle, MinusCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExperimentResult {
  variant: string
  metric: string
  sampleSize: number
  conversions: number
  conversionRate: number
  liftPercent: number
  pValue: number
  isSignificant: boolean
  verdict: string
}

interface Experiment {
  id: string
  name: string
  description: string
  hypothesis: string
  status: string
  type: string
  primaryMetric: string
  startedAt: string | null
  endedAt: string | null
  results: ExperimentResult[]
  verdict: string
  maxLift: number
}

const VERDICT_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  winner: { label: 'Winner', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: CheckCircle },
  loser: { label: 'Loser', color: 'bg-red-500/15 text-red-300 border-red-500/30', icon: XCircle },
  inconclusive: { label: 'Inconclusive', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30', icon: MinusCircle },
  running: { label: 'Running', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30', icon: Clock },
  draft: { label: 'Draft', color: 'bg-surface-2 text-muted border-line', icon: MinusCircle },
}

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetch('/api/experiments').then(r => r.json()).then(setExperiments)
  }, [])

  const filtered = filter === 'all' ? experiments :
    experiments.filter(e => e.verdict === filter || e.status === filter)

  const stats = {
    total: experiments.length,
    running: experiments.filter(e => e.status === 'running').length,
    winners: experiments.filter(e => e.verdict === 'winner').length,
    avgLift: experiments.filter(e => e.maxLift > 0).length > 0
      ? (experiments.filter(e => e.maxLift > 0).reduce((s, e) => s + e.maxLift, 0) /
        experiments.filter(e => e.maxLift > 0).length).toFixed(1)
      : '0',
  }

  return (
    <DashboardLayout>
      <Topbar
        title="Experimentation Intelligence"
        subtitle="A/B tests · Statistical significance · Experiment recommendations"
      />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Experiments', value: stats.total, color: 'text-accent', bg: 'bg-accent/10' },
            { label: 'Running Now', value: stats.running, color: 'text-blue-600', bg: 'bg-blue-500/15' },
            { label: 'Winners', value: stats.winners, color: 'text-emerald-600', bg: 'bg-emerald-500/15' },
            { label: 'Avg Lift (winners)', value: `${stats.avgLift}%`, color: 'text-violet-600', bg: 'bg-violet-500/15' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-ink">{s.value}</p>
                <p className="text-xs text-muted mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'running', 'winner', 'inconclusive', 'completed', 'draft'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize",
                filter === f
                  ? "bg-accent text-accent-fg border-accent"
                  : "bg-surface text-muted border-line hover:border-line-2"
              )}
            >
              {f === 'all' ? 'All' : f}
              {f !== 'all' && (
                <span className="ml-1 text-[10px] opacity-70">
                  ({experiments.filter(e => e.verdict === f || e.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Experiment cards */}
        <div className="space-y-4">
          {filtered.map(exp => {
            const config = VERDICT_CONFIG[exp.verdict] ?? VERDICT_CONFIG.inconclusive
            const Icon = config.icon
            const controlResult = exp.results.find(r => r.variant.toLowerCase().includes('control'))
            const treatmentResults = exp.results.filter(r => !r.variant.toLowerCase().includes('control'))

            return (
              <Card key={exp.id} className="hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={cn("rounded-lg p-2 mt-0.5", config.color.split(' ')[0], 'border', config.color.split(' ')[2])}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-ink">{exp.name}</h3>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", config.color)}>
                            {config.label}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-muted border border-line">
                            {exp.type.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-muted mt-1">{exp.description}</p>
                        {exp.hypothesis && (
                          <p className="text-xs text-faint mt-1 italic">"{exp.hypothesis}"</p>
                        )}

                        {exp.results.length > 0 && (
                          <div className="mt-3 grid gap-2">
                            {exp.results.map((result) => {
                              const isControl = result.variant.toLowerCase().includes('control')
                              const isWinner = result.verdict === 'winner'
                              return (
                                <div
                                  key={result.variant}
                                  className={cn(
                                    "rounded-lg p-3 border",
                                    isWinner ? "border-emerald-500/30 bg-emerald-500/15" :
                                      isControl ? "border-line bg-surface-2" :
                                        "border-line bg-surface"
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-ink-2">{result.variant}</span>
                                      {isWinner && <span className="text-xs text-emerald-600 font-bold">★ Winner</span>}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted">
                                      <span>{result.sampleSize.toLocaleString()} users</span>
                                      <span className="font-semibold text-ink-2">
                                        {(result.conversionRate * 100).toFixed(1)}% conversion
                                      </span>
                                      {result.liftPercent !== 0 && (
                                        <span className={cn("font-bold",
                                          result.liftPercent > 0 ? 'text-emerald-600' : 'text-red-500'
                                        )}>
                                          {result.liftPercent > 0 ? '+' : ''}{result.liftPercent.toFixed(1)}% lift
                                        </span>
                                      )}
                                      {result.pValue !== 1 && (
                                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded",
                                          result.isSignificant
                                            ? 'bg-emerald-500/20 text-emerald-300'
                                            : 'bg-surface-2 text-muted'
                                        )}>
                                          p={result.pValue < 0.001 ? '<0.001' : result.pValue.toFixed(3)}
                                          {result.isSignificant ? ' ✓' : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {exp.maxLift > 0 && (
                        <div>
                          <p className="text-xl font-bold text-emerald-600">+{exp.maxLift.toFixed(1)}%</p>
                          <p className="text-xs text-faint">max lift</p>
                        </div>
                      )}
                      <p className="text-xs text-faint mt-2">
                        {exp.primaryMetric?.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-faint">
              <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No experiments found. Load demo data from the Decision Center.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
