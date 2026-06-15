"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "../../dashboard-layout"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingDown, ArrowRight, Users } from "lucide-react"
import { cn, formatNumber, formatPercent } from "@/lib/utils"

interface FunnelStep {
  step: string
  eventName: string
  users: number
  conversionRate: number
  dropOffRate: number
}

interface FunnelResult {
  steps: FunnelStep[]
  overallConversion: number
  totalEntered: number
  totalConverted: number
}

export default function FunnelsPage() {
  const [data, setData] = useState<FunnelResult | null>(null)
  const [funnelType, setFunnelType] = useState<'onboarding' | 'activation'>('onboarding')

  useEffect(() => {
    fetch(`/api/analytics/funnels?type=${funnelType}`)
      .then(r => r.json())
      .then(setData)
  }, [funnelType])

  const steps = data?.steps ?? []
  const maxUsers = steps[0]?.users ?? 1

  return (
    <DashboardLayout>
      <Topbar
        title="Funnel Analysis"
        subtitle="Conversion rates · Drop-off analysis · Activation tracking"
        actions={
          <Select value={funnelType} onValueChange={(v) => setFunnelType(v as typeof funnelType)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="onboarding">Onboarding Funnel</SelectItem>
              <SelectItem value="activation">Activation Funnel</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      <div className="p-6 space-y-6">
        {/* Summary cards */}
        {data && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Entered', value: formatNumber(data.totalEntered), sub: 'top of funnel', color: 'text-blue-600', bg: 'bg-blue-500/15' },
              { label: 'Total Converted', value: formatNumber(data.totalConverted), sub: 'bottom of funnel', color: 'text-emerald-600', bg: 'bg-emerald-500/15' },
              { label: 'Overall Conversion', value: formatPercent(data.overallConversion), sub: 'end-to-end rate', color: 'text-accent', bg: 'bg-accent/10' },
            ].map(m => (
              <Card key={m.label}>
                <CardContent className="p-4">
                  <p className={cn("text-2xl font-bold", m.color)}>{m.value}</p>
                  <p className="text-sm font-medium text-ink-2 mt-0.5">{m.label}</p>
                  <p className="text-xs text-faint">{m.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Funnel visualization */}
        <Card>
          <CardHeader>
            <CardTitle>{funnelType === 'onboarding' ? 'Onboarding' : 'Activation'} Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {steps.length === 0 ? (
              <div className="text-center py-12 text-faint">Load demo data to see funnel analysis</div>
            ) : (
              <div className="space-y-2">
                {steps.map((step, idx) => {
                  const width = (step.users / maxUsers) * 100
                  const isLargestDrop = idx > 0 && step.dropOffRate === Math.max(...steps.slice(1).map(s => s.dropOffRate))
                  return (
                    <div key={step.step}>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-6 h-6 rounded-full bg-accent/15 text-accent text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </div>
                        <span className="text-sm font-medium text-ink-2 w-44 flex-shrink-0">{step.step}</span>
                        <div className="flex-1">
                          <div className="relative h-10 bg-surface-2 rounded-lg overflow-hidden">
                            <div
                              className={cn(
                                "absolute left-0 top-0 h-full rounded-lg flex items-center justify-end pr-3 transition-all",
                                idx === 0 ? "bg-accent" :
                                  step.conversionRate >= 70 ? "bg-emerald-500" :
                                    step.conversionRate >= 40 ? "bg-amber-500" : "bg-red-400"
                              )}
                              style={{ width: `${width}%` }}
                            >
                              <span className="text-xs text-white font-bold">
                                {formatNumber(step.users)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="w-28 text-right">
                          {idx === 0 ? (
                            <span className="text-xs text-muted">100% (baseline)</span>
                          ) : (
                            <span className={cn("text-xs font-semibold",
                              step.conversionRate >= 70 ? 'text-emerald-600' :
                                step.conversionRate >= 40 ? 'text-amber-600' : 'text-red-500'
                            )}>
                              {formatPercent(step.conversionRate)} converted
                            </span>
                          )}
                        </div>
                      </div>
                      {idx > 0 && step.dropOffRate > 0 && (
                        <div className="flex items-center gap-2 pl-9 mb-1">
                          <TrendingDown className={cn("h-3 w-3", isLargestDrop ? 'text-red-500' : 'text-faint')} />
                          <span className={cn("text-[11px]", isLargestDrop ? 'text-red-500 font-semibold' : 'text-faint')}>
                            {formatPercent(step.dropOffRate)} dropped off here
                            {isLargestDrop && " ← highest drop-off"}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insight card */}
        {steps.length > 0 && (
          <Card className="border-amber-500/30 bg-amber-500/15">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-amber-200">Key Insight</p>
              <p className="text-sm text-amber-300 mt-1">
                {(() => {
                  const maxDrop = steps.slice(1).reduce((max, s) => s.dropOffRate > max.dropOffRate ? s : max, steps[1])
                  return maxDrop
                    ? `The biggest drop-off is at "${maxDrop.step}" with ${formatPercent(maxDrop.dropOffRate)} of users not proceeding. Experiment evidence shows simplifying this step could increase downstream conversion by 32%.`
                    : 'Analyze your funnel to identify the biggest drop-off points.'
                })()}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
