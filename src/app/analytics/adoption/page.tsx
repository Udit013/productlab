"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "../../dashboard-layout"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Zap, Users, TrendingUp } from "lucide-react"
import { cn, formatNumber } from "@/lib/utils"

interface FeatureAdoptionRow {
  featureSlug: string
  featureName: string
  adoptedUsers: number
  totalUsers: number
  adoptionRate: number
  avgUsesPerUser: number
  stickiness: number
}

interface PlanBreakdown {
  plan: string
  count: number
  active_count: number
}

export default function AdoptionPage() {
  const [adoption, setAdoption] = useState<FeatureAdoptionRow[]>([])
  const [plans, setPlans] = useState<PlanBreakdown[]>([])
  const [sort, setSort] = useState<'adoptionRate' | 'avgUsesPerUser' | 'stickiness'>('adoptionRate')

  useEffect(() => {
    fetch('/api/analytics/adoption')
      .then(r => r.json())
      .then(d => {
        setAdoption(d.adoption ?? [])
        setPlans(d.plans ?? [])
      })
  }, [])

  const sorted = [...adoption].sort((a, b) => b[sort] - a[sort])

  return (
    <DashboardLayout>
      <Topbar title="Feature Adoption" subtitle="Adoption rate · Engagement · Stickiness by feature" />
      <div className="p-6 space-y-6">
        {/* Plan distribution */}
        {plans.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">User Plan Distribution</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {plans.map((p: PlanBreakdown) => {
                  const total = plans.reduce((s, x) => s + Number(x.count), 0)
                  const pct = total > 0 ? (Number(p.count) / total * 100) : 0
                  const planColors: Record<string, string> = {
                    enterprise: 'bg-violet-500',
                    growth: 'bg-accent',
                    starter: 'bg-blue-500',
                    free: 'bg-line-2',
                  }
                  return (
                    <div key={p.plan} className="text-center">
                      <p className="text-2xl font-bold text-ink">{Number(p.count).toLocaleString()}</p>
                      <p className="text-sm text-muted capitalize">{p.plan}</p>
                      <p className="text-xs text-faint">{pct.toFixed(1)}% of users</p>
                      <div className="mt-2 h-2 bg-surface-2 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", planColors[p.plan] ?? 'bg-line-2')} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sort controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Sort by:</span>
          {[
            { key: 'adoptionRate', label: 'Adoption Rate' },
            { key: 'avgUsesPerUser', label: 'Avg Uses / User' },
            { key: 'stickiness', label: 'Stickiness' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setSort(s.key as typeof sort)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                sort === s.key ? "bg-accent text-accent-fg border-accent" : "bg-surface text-muted border-line hover:border-line-2"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Feature adoption table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Feature Adoption · {adoption.length} features tracked</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {adoption.length === 0 ? (
              <div className="p-12 text-center text-faint">Load demo data to see feature adoption</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface-2">
                      <th className="text-left p-3 text-xs font-semibold text-muted">#</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted">Feature</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted w-56">Adoption Rate</th>
                      <th className="text-right p-3 text-xs font-semibold text-muted">Users</th>
                      <th className="text-right p-3 text-xs font-semibold text-muted">Avg Uses</th>
                      <th className="text-right p-3 text-xs font-semibold text-muted">Stickiness</th>
                      <th className="text-right p-3 text-xs font-semibold text-muted">Signal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((f, idx) => {
                      const signal = f.adoptionRate >= 70 ? { label: 'Core', color: 'bg-emerald-500/15 text-emerald-300' } :
                        f.adoptionRate >= 40 ? { label: 'Growing', color: 'bg-blue-500/15 text-blue-300' } :
                          f.adoptionRate >= 15 ? { label: 'Emerging', color: 'bg-amber-500/15 text-amber-300' } :
                            { label: 'Low', color: 'bg-red-500/15 text-red-600' }
                      return (
                        <tr key={f.featureSlug} className="border-b border-line hover:bg-surface-2">
                          <td className="p-3 text-xs text-faint">{idx + 1}</td>
                          <td className="p-3">
                            <p className="font-medium text-ink">{f.featureName || f.featureSlug}</p>
                            <p className="text-xs text-faint">{f.featureSlug}</p>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Progress value={f.adoptionRate} className="flex-1 h-2"
                                indicatorClassName={
                                  f.adoptionRate >= 70 ? 'bg-emerald-500' :
                                    f.adoptionRate >= 40 ? 'bg-blue-500' :
                                      f.adoptionRate >= 15 ? 'bg-amber-500' : 'bg-red-400'
                                }
                              />
                              <span className="text-xs font-semibold text-ink-2 w-12 text-right">
                                {f.adoptionRate.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-right text-sm text-ink-2">
                            {formatNumber(f.adoptedUsers)}
                          </td>
                          <td className="p-3 text-right text-sm text-ink-2">
                            {f.avgUsesPerUser.toFixed(1)}
                          </td>
                          <td className="p-3 text-right text-sm text-ink-2">
                            {f.stickiness.toFixed(1)}%
                          </td>
                          <td className="p-3 text-right">
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", signal.color)}>
                              {signal.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
