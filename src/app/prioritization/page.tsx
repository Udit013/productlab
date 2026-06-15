"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "../dashboard-layout"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, statusColor, cn } from "@/lib/utils"
import { ListOrdered, TrendingUp, DollarSign, Clock, Target } from "lucide-react"

type ScoringModel = 'rice' | 'ice' | 'wsjf' | 'priority'

interface Initiative {
  id: string
  rank: number
  name: string
  description: string
  status: string
  quarter: string | null
  reach: number
  impact: number
  confidence: number
  effort: number
  riceScore: number
  iceScore: number
  wsjfScore: number
  priorityScore: number
  strategicAlignment: number
  expectedRoi: number
  expectedRetentionLift: number
  expectedRevenueLift: number
  engineeringCost: number
  recommendation: string | null
  tags: string[]
}

interface Summary {
  total: number
  inProgress: number
  planned: number
  backlog: number
  totalExpectedRevenueLift: number
  avgPriorityScore: number
}

const MODEL_INFO: Record<ScoringModel, { label: string; description: string; formula: string }> = {
  priority: { label: 'Priority Score', description: 'Composite score combining RICE, ICE, WSJF and strategic alignment', formula: 'RICE × 0.35 + ICE × 0.25 + WSJF × 0.25 + Alignment × 0.15' },
  rice: { label: 'RICE', description: 'Reach × Impact × Confidence ÷ Effort', formula: '(Reach × Impact × Confidence) / Effort' },
  ice: { label: 'ICE', description: 'Impact + Confidence + Ease average', formula: '(Impact + Confidence + Ease) / 3' },
  wsjf: { label: 'WSJF', description: 'Weighted Shortest Job First — cost of delay vs. effort', formula: '(User Value + Time Value + Risk Reduction) / Job Size' },
}

function getScore(init: Initiative, model: ScoringModel): number {
  return model === 'rice' ? init.riceScore :
    model === 'ice' ? init.iceScore :
      model === 'wsjf' ? init.wsjfScore :
        init.priorityScore
}

function formatScore(score: number, model: ScoringModel): string {
  if (model === 'rice') return score.toLocaleString()
  if (model === 'ice') return score.toFixed(1)
  return score.toFixed(1)
}

export default function PrioritizationPage() {
  const [model, setModel] = useState<ScoringModel>('priority')
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)

  useEffect(() => {
    fetch(`/api/prioritization?model=${model}`)
      .then(r => r.json())
      .then(d => {
        setInitiatives(d.initiatives ?? [])
        setSummary(d.summary ?? null)
      })
  }, [model])

  const modelInfo = MODEL_INFO[model]
  const maxScore = Math.max(...initiatives.map(i => getScore(i, model)), 1)

  return (
    <DashboardLayout>
      <Topbar
        title="Prioritization Engine"
        subtitle="RICE · ICE · WSJF scoring models"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Scoring model:</span>
            <Select value={model} onValueChange={(v) => setModel(v as ScoringModel)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority Score</SelectItem>
                <SelectItem value="rice">RICE</SelectItem>
                <SelectItem value="ice">ICE</SelectItem>
                <SelectItem value="wsjf">WSJF</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Initiatives', value: summary.total, icon: ListOrdered, color: 'text-accent', bg: 'bg-accent/10' },
              { label: 'In Progress', value: summary.inProgress, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-500/15' },
              { label: 'Expected Revenue Lift', value: formatCurrency(summary.totalExpectedRevenueLift), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-500/15' },
              { label: 'Avg Priority Score', value: summary.avgPriorityScore, icon: Target, color: 'text-violet-600', bg: 'bg-violet-500/15' },
            ].map(m => {
              const Icon = m.icon
              return (
                <Card key={m.label}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn("rounded-lg p-2.5", m.bg)}>
                      <Icon className={cn("h-5 w-5", m.color)} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-ink">{m.value}</p>
                      <p className="text-xs text-muted">{m.label}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Model explanation */}
        <Card className="bg-accent/10 border-accent/30">
          <CardContent className="p-4 flex gap-4 items-start">
            <div className="text-2xl">📐</div>
            <div>
              <p className="font-semibold text-accent text-sm">{modelInfo.label} Formula</p>
              <p className="text-xs text-accent mt-0.5">{modelInfo.description}</p>
              <code className="text-xs text-accent font-mono mt-1 block">{modelInfo.formula}</code>
            </div>
          </CardContent>
        </Card>

        {/* Ranked table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ranked Initiatives — {modelInfo.label}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-2">
                    <th className="text-left p-3 text-xs font-semibold text-muted w-8">#</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted">Initiative</th>
                    <th className="text-center p-3 text-xs font-semibold text-muted">Score</th>
                    <th className="text-center p-3 text-xs font-semibold text-muted">Status</th>
                    <th className="text-center p-3 text-xs font-semibold text-muted">Confidence</th>
                    <th className="text-center p-3 text-xs font-semibold text-muted">ROI</th>
                    <th className="text-right p-3 text-xs font-semibold text-muted">Revenue Lift</th>
                    <th className="text-right p-3 text-xs font-semibold text-muted">Retention</th>
                    <th className="text-right p-3 text-xs font-semibold text-muted">Effort</th>
                  </tr>
                </thead>
                <tbody>
                  {initiatives.map((init, idx) => {
                    const score = getScore(init, model)
                    const barWidth = (score / maxScore) * 100
                    return (
                      <tr key={init.id} className="border-b border-line hover:bg-surface-2 transition-colors">
                        <td className="p-3 text-center">
                          <span className="text-xs font-bold text-faint">#{idx + 1}</span>
                        </td>
                        <td className="p-3">
                          <p className="font-medium text-ink">{init.name}</p>
                          {init.quarter && (
                            <p className="text-xs text-faint mt-0.5">{init.quarter}</p>
                          )}
                          {/* Score bar */}
                          <div className="mt-1.5 h-1 bg-surface-2 rounded-full overflow-hidden w-32">
                            <div
                              className="h-full bg-accent rounded-full transition-all"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-base font-bold text-accent">
                            {formatScore(score, model)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", statusColor(init.status))}>
                            {init.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={cn("text-xs font-semibold",
                            init.confidence >= 80 ? 'text-emerald-600' :
                              init.confidence >= 60 ? 'text-amber-600' : 'text-muted'
                          )}>
                            {init.confidence}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-xs font-semibold text-ink-2">{init.expectedRoi}×</span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-sm font-semibold text-emerald-600">
                            {formatCurrency(init.expectedRevenueLift)}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-xs text-blue-600 font-semibold">+{init.expectedRetentionLift}%</span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-xs text-muted">{init.engineeringCost}w</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {initiatives.length === 0 && (
                <div className="p-12 text-center text-faint text-sm">
                  No initiatives found. Load demo data from the Decision Center.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
