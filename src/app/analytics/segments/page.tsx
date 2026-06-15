"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "../../dashboard-layout"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Star, AlertTriangle, TrendingDown, Zap, UserCheck } from "lucide-react"
import { cn, formatNumber } from "@/lib/utils"

interface Segment {
  segment: string
  userCount: number
  avgSessions: number
  avgActiveWeeks: number
  avgDaysInactive: number
}

const SEGMENT_CONFIG: Record<string, {
  label: string
  description: string
  icon: typeof Users
  color: string
  bg: string
  border: string
}> = {
  power: { label: 'Power Users', description: 'High-frequency, long-term active users. Core advocates.', icon: Star, color: 'text-amber-600', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  expansion: { label: 'Expansion Candidates', description: 'Paid users with high engagement. Ready to upgrade.', icon: TrendingDown, color: 'text-violet-600', bg: 'bg-violet-500/15', border: 'border-violet-500/30' },
  new: { label: 'New Users', description: 'Joined in the last 14 days. Critical onboarding window.', icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  casual: { label: 'Casual Users', description: 'Moderate usage, not yet power users. Growth opportunity.', icon: Users, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30' },
  churn_risk: { label: 'Churn Risk', description: 'Inactive 21-60 days. Intervention needed immediately.', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  churned: { label: 'Churned', description: 'Inactive 60+ days. Win-back campaign eligible.', icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-500/15', border: 'border-red-500/30' },
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([])

  useEffect(() => {
    fetch('/api/analytics/segments').then(r => r.json()).then(setSegments)
  }, [])

  const total = segments.reduce((s, seg) => s + seg.userCount, 0)

  const actions: Record<string, string[]> = {
    power: ['Invite to beta features', 'Request case study', 'Referral program', 'Exclusive webinar'],
    expansion: ['Show upgrade modal on 10th session', 'Highlight team features', 'Custom pricing outreach'],
    new: ['D7 activation check-in email', 'In-app onboarding guide', 'Team invite nudge'],
    casual: ['Feature education email series', 'Usage tips notification', 'In-app tooltips'],
    churn_risk: ['Personalized win-back email', 'In-app re-engagement nudge', 'Offer discount or concierge'],
    churned: ['Quarterly re-engagement campaign', 'Product update announcement', 'Special win-back offer'],
  }

  return (
    <DashboardLayout>
      <Topbar title="User Segments" subtitle="Power users · Casual users · Churn risk · Expansion candidates" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {segments.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-faint">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Load demo data to see user segments
            </div>
          ) : (
            segments.map(seg => {
              const config = SEGMENT_CONFIG[seg.segment] ?? {
                label: seg.segment,
                description: '',
                icon: Users,
                color: 'text-muted',
                bg: 'bg-surface-2',
                border: 'border-line',
              }
              const Icon = config.icon
              const pct = total > 0 ? (seg.userCount / total * 100) : 0
              const segActions = actions[seg.segment] ?? []

              return (
                <Card key={seg.segment} className={cn("border-2 hover:shadow-md transition-all", config.border)}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className={cn("rounded-xl p-3", config.bg)}>
                        <Icon className={cn("h-6 w-6", config.color)} />
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-ink">{formatNumber(seg.userCount)}</p>
                        <p className="text-xs text-faint">{pct.toFixed(1)}% of users</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <h3 className={cn("font-semibold text-base", config.color)}>{config.label}</h3>
                      <p className="text-xs text-muted mt-1">{config.description}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {[
                        { label: 'Avg Sessions', value: seg.avgSessions },
                        { label: 'Active Weeks', value: seg.avgActiveWeeks },
                        { label: 'Days Inactive', value: seg.avgDaysInactive },
                      ].map(m => (
                        <div key={m.label} className="rounded-lg bg-surface-2 p-2 text-center">
                          <p className="text-sm font-bold text-ink">{m.value}</p>
                          <p className="text-[10px] text-faint">{m.label}</p>
                        </div>
                      ))}
                    </div>
                    {segActions.length > 0 && (
                      <div className="mt-3 border-t border-line pt-3">
                        <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-1.5">Recommended Actions</p>
                        <ul className="space-y-1">
                          {segActions.slice(0, 3).map(a => (
                            <li key={a} className="text-xs text-muted flex items-start gap-1.5">
                              <span className="text-accent mt-0.5">→</span>
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
