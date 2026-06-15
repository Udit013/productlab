"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "../dashboard-layout"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Search, RefreshCw } from "lucide-react"
import { cn, formatNumber } from "@/lib/utils"

interface EventSummary {
  total_events: string
  unique_users: string
  unique_event_types: string
  unique_sessions: string
}

interface TopEvent {
  event_name: string
  event_category: string | null
  total: string
  unique_users: string
  unique_sessions: string
}

interface Event {
  id: string
  eventName: string
  eventCategory: string | null
  userId: string | null
  sessionId: string | null
  properties: Record<string, unknown>
  receivedAt: string
  deviceType: string | null
  country: string | null
}

const CATEGORY_COLORS: Record<string, string> = {
  acquisition: 'bg-blue-500/15 text-blue-300',
  onboarding: 'bg-accent/10 text-accent',
  engagement: 'bg-emerald-500/15 text-emerald-300',
  navigation: 'bg-surface-2 text-muted',
  auth: 'bg-amber-500/15 text-amber-300',
  revenue: 'bg-green-500/15 text-green-300',
}

const SDK_SNIPPET = `// ProductLab JavaScript SDK
const ProductLab = {
  track(event, properties = {}) {
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName: event, properties })
    })
  }
}

// Usage:
ProductLab.track('feature_used', {
  feature: 'AI Search',
  userId: '123'
})`

export default function EventsPage() {
  const [summary, setSummary] = useState<EventSummary | null>(null)
  const [topEvents, setTopEvents] = useState<TopEvent[]>([])
  const [recentEvents, setRecentEvents] = useState<Event[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'explorer' | 'definitions' | 'sdk'>('explorer')

  async function load() {
    setLoading(true)
    const [sum, top, recent] = await Promise.all([
      fetch('/api/events?action=summary').then(r => r.json()),
      fetch('/api/events?action=top').then(r => r.json()),
      fetch(`/api/events?limit=50${search ? `&event=${encodeURIComponent(search)}` : ''}`).then(r => r.json()),
    ])
    setSummary(sum)
    setTopEvents(top)
    setRecentEvents(recent)
    setLoading(false)
  }

  useEffect(() => { load() }, [search])

  return (
    <DashboardLayout>
      <Topbar
        title="Event Explorer"
        subtitle="Event tracking · Event definitions · Search & filter"
        actions={
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-sm text-muted hover:bg-surface-2"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        }
      />
      <div className="p-6 space-y-6">
        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Events', value: formatNumber(Number(summary.total_events)) },
              { label: 'Unique Users', value: formatNumber(Number(summary.unique_users)) },
              { label: 'Event Types', value: Number(summary.unique_event_types) },
              { label: 'Sessions', value: formatNumber(Number(summary.unique_sessions)) },
            ].map(m => (
              <Card key={m.label}>
                <CardContent className="p-4">
                  <p className="text-2xl font-bold text-ink">{m.value}</p>
                  <p className="text-xs text-muted mt-0.5">{m.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-line">
          {[
            { key: 'explorer', label: 'Event Explorer' },
            { key: 'definitions', label: 'Top Events' },
            { key: 'sdk', label: 'SDK Integration' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as typeof activeTab)}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === t.key
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-ink-2"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'explorer' && (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-faint" />
              <input
                type="text"
                placeholder="Search events by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Events table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Events</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line bg-surface-2">
                        <th className="text-left p-3 text-xs font-semibold text-muted">Event</th>
                        <th className="text-left p-3 text-xs font-semibold text-muted">Category</th>
                        <th className="text-left p-3 text-xs font-semibold text-muted">Properties</th>
                        <th className="text-left p-3 text-xs font-semibold text-muted">Device</th>
                        <th className="text-right p-3 text-xs font-semibold text-muted">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEvents.map(event => (
                        <tr key={event.id} className="border-b border-line hover:bg-surface-2">
                          <td className="p-3">
                            <span className="font-mono text-xs text-accent bg-accent/10 px-2 py-0.5 rounded">
                              {event.eventName}
                            </span>
                          </td>
                          <td className="p-3">
                            {event.eventCategory && (
                              <span className={cn("text-xs px-2 py-0.5 rounded-full",
                                CATEGORY_COLORS[event.eventCategory] ?? 'bg-surface-2 text-muted'
                              )}>
                                {event.eventCategory}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="font-mono text-xs text-muted max-w-xs truncate block">
                              {Object.keys(event.properties ?? {}).length > 0
                                ? JSON.stringify(event.properties).slice(0, 60) + '...'
                                : '{}'}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-muted">{event.deviceType ?? '—'}</td>
                          <td className="p-3 text-right text-xs text-faint">
                            {new Date(event.receivedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {recentEvents.length === 0 && (
                    <div className="p-12 text-center text-faint">
                      <Database className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No events found. Load demo data from the Decision Center.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'definitions' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Top Events by Volume</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-2">
                    <th className="text-left p-3 text-xs font-semibold text-muted">Event Name</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted">Category</th>
                    <th className="text-right p-3 text-xs font-semibold text-muted">Total Fires</th>
                    <th className="text-right p-3 text-xs font-semibold text-muted">Unique Users</th>
                    <th className="text-right p-3 text-xs font-semibold text-muted">Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {topEvents.map((e: TopEvent, i) => (
                    <tr key={e.event_name} className="border-b border-line hover:bg-surface-2">
                      <td className="p-3">
                        <span className="font-mono text-xs text-accent bg-accent/10 px-2 py-0.5 rounded">
                          {e.event_name}
                        </span>
                      </td>
                      <td className="p-3">
                        {e.event_category && (
                          <span className={cn("text-xs px-2 py-0.5 rounded-full",
                            CATEGORY_COLORS[e.event_category] ?? 'bg-surface-2 text-muted'
                          )}>
                            {e.event_category}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right text-sm font-semibold text-ink">
                        {formatNumber(Number(e.total))}
                      </td>
                      <td className="p-3 text-right text-sm text-muted">
                        {formatNumber(Number(e.unique_users))}
                      </td>
                      <td className="p-3 text-right text-sm text-muted">
                        {formatNumber(Number(e.unique_sessions))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {activeTab === 'sdk' && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">JavaScript SDK</CardTitle></CardHeader>
              <CardContent>
                <pre className="bg-base border border-line text-accent p-4 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed">
                  {SDK_SNIPPET}
                </pre>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Supported Events</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['page_view', 'session_start', 'signup', 'onboarding_step', 'activation', 'login',
                    'purchase', 'feature_click', 'feature_use', 'conversion', 'custom_event'].map(e => (
                    <div key={e} className="flex items-center gap-2 p-2 rounded-lg bg-surface-2 border border-line">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <span className="font-mono text-xs text-ink-2">{e}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
