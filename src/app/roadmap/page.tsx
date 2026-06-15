"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "../dashboard-layout"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Map, DollarSign, Clock, CheckCircle2 } from "lucide-react"
import { formatCurrency, statusColor, cn } from "@/lib/utils"

interface RoadmapItem {
  id: string
  name: string
  status: string
  priority: number
  estimatedWeeks: number
  expectedOutcome: string | null
  priorityScore: number
  expectedRevenueLift: number
  expectedRetentionLift: number
  tags: string[]
  dependencies: string[] | null
}

interface QuarterData {
  quarter: string
  items: RoadmapItem[]
  totalWeeks: number
  expectedRevenueLift: number
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

const QUARTER_COLORS: Record<string, string> = {
  'Q1 2025': 'border-accent bg-accent/10',
  'Q2 2025': 'border-violet-400 bg-violet-500/15',
  'Q3 2025': 'border-blue-400 bg-blue-500/15',
  'Q4 2025': 'border-cyan-400 bg-cyan-500/15',
}

const STATUS_COLORS: Record<string, string> = {
  in_progress: 'bg-blue-500',
  planned: 'bg-accent',
  completed: 'bg-emerald-500',
}

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState<QuarterData[]>([])
  const [goals, setGoals] = useState<Goal[]>([])

  useEffect(() => {
    fetch('/api/roadmap').then(r => r.json()).then(d => {
      setRoadmap(d.roadmap ?? [])
      setGoals(d.goals ?? [])
    })
  }, [])

  return (
    <DashboardLayout>
      <Topbar title="Roadmap Intelligence" subtitle="Quarterly planning · Capacity allocation · Expected outcomes" />
      <div className="p-6 space-y-6">
        {/* Goals */}
        {goals.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Strategic Goals</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {goals.map(goal => (
                  <div key={goal.id} className={cn(
                    "rounded-lg p-3 border",
                    goal.status === 'on_track' ? 'bg-emerald-500/15 border-emerald-500/30' :
                      goal.status === 'at_risk' ? 'bg-amber-500/15 border-amber-500/30' :
                        'bg-red-500/15 border-red-500/30'
                  )}>
                    <p className="text-xs font-semibold text-ink-2">{goal.name}</p>
                    <p className="text-lg font-bold text-ink mt-1">
                      {goal.currentValue}{goal.unit === '%' ? '%' : ''}
                      <span className="text-xs text-faint font-normal ml-1">/ {goal.targetValue}{goal.unit === '%' ? '%' : ''}</span>
                    </p>
                    <p className={cn("text-xs font-medium capitalize mt-0.5",
                      goal.status === 'on_track' ? 'text-emerald-600' :
                        goal.status === 'at_risk' ? 'text-amber-600' : 'text-red-600'
                    )}>
                      {goal.status.replace('_', ' ')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Roadmap timeline */}
        {roadmap.length === 0 ? (
          <div className="text-center py-12 text-faint">
            <Map className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Load demo data to see roadmap
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {roadmap.map(quarter => {
              const qColor = QUARTER_COLORS[quarter.quarter] ?? 'border-line-2 bg-surface-2'
              return (
                <div key={quarter.quarter} className={cn("rounded-xl border-l-4 p-5", qColor.split(' ')[0], 'bg-surface border')}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-ink">{quarter.quarter}</h2>
                      <p className="text-xs text-muted mt-0.5">
                        {quarter.items.length} initiatives · {quarter.totalWeeks}w capacity
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">{formatCurrency(quarter.expectedRevenueLift)}</p>
                      <p className="text-xs text-faint">expected ARR</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {quarter.items.map((item, idx) => (
                      <div key={item.id} className="rounded-lg bg-surface border border-line p-3 hover:border-line-2 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-2 text-muted text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-ink">{item.name}</p>
                              <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0", statusColor(item.status))}>
                                {item.status.replace('_', ' ')}
                              </span>
                            </div>
                            {item.expectedOutcome && (
                              <p className="text-xs text-muted mt-1">{item.expectedOutcome}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[10px] text-faint flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.estimatedWeeks}w
                              </span>
                              {item.expectedRevenueLift > 0 && (
                                <span className="text-[10px] text-emerald-600 font-medium">
                                  {formatCurrency(item.expectedRevenueLift)}/yr
                                </span>
                              )}
                              {item.expectedRetentionLift > 0 && (
                                <span className="text-[10px] text-blue-600 font-medium">
                                  +{item.expectedRetentionLift}% retention
                                </span>
                              )}
                            </div>

                            {/* Week blocks */}
                            <div className="flex gap-0.5 mt-2 flex-wrap">
                              {Array.from({ length: Math.min(item.estimatedWeeks, 16) }).map((_, w) => (
                                <div
                                  key={w}
                                  className={cn(
                                    "h-2 w-4 rounded-sm",
                                    STATUS_COLORS[item.status] ?? 'bg-line-2'
                                  )}
                                />
                              ))}
                              {item.estimatedWeeks > 16 && (
                                <span className="text-[10px] text-faint self-center ml-1">+{item.estimatedWeeks - 16}w</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
