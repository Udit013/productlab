"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "../../dashboard-layout"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CohortRow {
  cohortDate: string
  cohortSize: number
  d1: number
  d7: number
  d14: number
  d30: number
  d60: number
  d90: number
}

interface RetentionSummary {
  d1: number
  d7: number
  d30: number
  d90: number
}

function heatColor(value: number): string {
  if (value === 0) return 'bg-surface-2 text-faint'
  if (value >= 60) return 'bg-accent text-accent-fg'
  if (value >= 40) return 'bg-accent/70 text-accent-fg'
  if (value >= 25) return 'bg-accent/40 text-accent'
  if (value >= 15) return 'bg-amber-500/30 text-amber-200'
  if (value >= 8) return 'bg-amber-500/15 text-amber-300'
  return 'bg-red-500/15 text-red-300'
}

export default function CohortsPage() {
  const [cohorts, setCohorts] = useState<CohortRow[]>([])
  const [summary, setSummary] = useState<RetentionSummary | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics/cohorts').then(r => r.json()),
      fetch('/api/analytics/cohorts?action=summary').then(r => r.json()),
    ]).then(([c, s]) => {
      setCohorts(c)
      setSummary(s)
    })
  }, [])

  const columns: Array<{ key: keyof CohortRow; label: string }> = [
    { key: 'd1', label: 'D1' },
    { key: 'd7', label: 'D7' },
    { key: 'd14', label: 'D14' },
    { key: 'd30', label: 'D30' },
    { key: 'd60', label: 'D60' },
    { key: 'd90', label: 'D90' },
  ]

  return (
    <DashboardLayout>
      <Topbar title="Cohort Analysis" subtitle="Retention curves · D1/D7/D30/D90 · Month-over-month trends" />
      <div className="p-6 space-y-6">
        {summary && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'D1 Retention', value: summary.d1, benchmark: 70 },
              { label: 'D7 Retention', value: summary.d7, benchmark: 40 },
              { label: 'D30 Retention', value: summary.d30, benchmark: 25 },
              { label: 'D90 Retention', value: summary.d90, benchmark: 15 },
            ].map(m => (
              <Card key={m.label}>
                <CardContent className="p-4">
                  <p className={cn("text-3xl font-bold",
                    m.value >= m.benchmark ? 'text-emerald-600' : 'text-amber-600'
                  )}>
                    {m.value.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted mt-0.5">{m.label}</p>
                  <p className={cn("text-xs mt-1",
                    m.value >= m.benchmark ? 'text-emerald-600' : 'text-amber-600'
                  )}>
                    {m.value >= m.benchmark ? '↑ above' : '↓ below'} {m.benchmark}% benchmark
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Retention Cohort Heatmap</CardTitle>
            <p className="text-xs text-muted mt-1">Each row is a signup cohort. Values show % still active at each time period.</p>
          </CardHeader>
          <CardContent>
            {cohorts.length === 0 ? (
              <div className="text-center py-12 text-faint">Load demo data to see cohort analysis</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2 text-xs text-muted font-semibold w-28">Cohort</th>
                      <th className="text-center p-2 text-xs text-muted font-semibold w-20">Size</th>
                      {columns.map(col => (
                        <th key={col.key} className="text-center p-2 text-xs text-muted font-semibold w-16">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cohorts.map(row => (
                      <tr key={row.cohortDate} className="border-t border-line">
                        <td className="p-2 text-xs text-muted font-medium">
                          {new Date(row.cohortDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-2 text-center text-xs text-ink-2 font-semibold">
                          {row.cohortSize.toLocaleString()}
                        </td>
                        {columns.map(col => {
                          const val = Number(row[col.key])
                          return (
                            <td key={col.key} className="p-1 text-center">
                              <div className={cn(
                                "rounded-md py-1.5 text-xs font-semibold transition-colors",
                                heatColor(val)
                              )}>
                                {val > 0 ? `${val.toFixed(0)}%` : '—'}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Color legend */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted">Retention rate:</span>
          {[
            { label: '60%+', cls: 'bg-accent' },
            { label: '40-60%', cls: 'bg-accent/70' },
            { label: '25-40%', cls: 'bg-accent/40' },
            { label: '15-25%', cls: 'bg-amber-500/30' },
            { label: '8-15%', cls: 'bg-amber-500/15' },
            { label: '<8%', cls: 'bg-red-500/15' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1">
              <div className={cn("w-4 h-4 rounded", l.cls)} />
              <span className="text-xs text-muted">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
