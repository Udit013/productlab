"use client"

import { useState } from "react"
import { DashboardLayout } from "../dashboard-layout"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Database, Sparkles, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<{ success?: boolean; users?: number; events?: number; error?: string } | null>(null)

  async function handleSeed() {
    setSeeding(true)
    setSeedResult(null)
    try {
      const res = await fetch('/api/demo', { method: 'POST' })
      const data = await res.json()
      setSeedResult(data)
    } catch (e) {
      setSeedResult({ error: String(e) })
    } finally {
      setSeeding(false)
    }
  }

  return (
    <DashboardLayout>
      <Topbar title="Settings" subtitle="Configuration · Demo data · Integrations" />
      <div className="p-6 space-y-6 max-w-2xl">

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-accent" />
              Demo Data Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-accent/10 border border-accent/30 p-4">
              <p className="text-sm font-medium text-accent">Realistic SaaS Demo Dataset</p>
              <ul className="mt-2 space-y-1 text-xs text-accent">
                <li>• 10,000 users across free, starter, growth, enterprise plans</li>
                <li>• 100,000+ events (sessions, features, onboarding, purchases)</li>
                <li>• 25 product features with realistic adoption curves</li>
                <li>• 10 experiments (6 winners, 2 running, 1 inconclusive, 1 draft)</li>
                <li>• 8 opportunity signals auto-discovered</li>
                <li>• 6 ranked initiatives with RICE/ICE/WSJF scores</li>
                <li>• Quarterly roadmap with expected outcomes</li>
              </ul>
            </div>

            <Button
              onClick={handleSeed}
              disabled={seeding}
              className="w-full"
            >
              {seeding ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Seeding database... (may take 30-60s)
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Load Demo Data
                </>
              )}
            </Button>

            {seedResult && (
              <div className={cn(
                "rounded-lg p-3 border flex items-start gap-2",
                seedResult.success ? "bg-emerald-500/15 border-emerald-500/30" : "bg-red-500/15 border-red-500/30"
              )}>
                {seedResult.success ? (
                  <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  {seedResult.success ? (
                    <>
                      <p className="text-sm font-medium text-emerald-300">Demo data loaded successfully!</p>
                      <p className="text-xs text-emerald-600 mt-0.5">
                        {seedResult.users?.toLocaleString()} users · {seedResult.events?.toLocaleString()} events
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-red-300">Seeding failed</p>
                      <p className="text-xs text-red-600 mt-0.5">{seedResult.error}</p>
                      <p className="text-xs text-red-500 mt-1">Make sure DATABASE_URL is set in .env.local</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4 text-muted" />
              Environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {[
                { key: 'DATABASE_URL', description: 'PostgreSQL connection string (required)', example: 'postgresql://user:pass@host/db' },
                { key: 'OLLAMA_BASE_URL', description: 'Ollama API endpoint (optional)', example: 'http://localhost:11434' },
                { key: 'NEXT_PUBLIC_APP_URL', description: 'App URL for SDK', example: 'http://localhost:3000' },
              ].map(env => (
                <div key={env.key} className="rounded-lg bg-surface-2 border border-line p-3">
                  <code className="text-xs text-accent font-mono font-bold">{env.key}</code>
                  <p className="text-xs text-muted mt-0.5">{env.description}</p>
                  <code className="text-[10px] text-faint mt-0.5 block">{env.example}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deployment</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted space-y-2">
            <p>ProductLab is designed for:</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>Vercel</strong> — zero-config Next.js deployment</li>
              <li>• <strong>Neon PostgreSQL</strong> — serverless Postgres, free tier available</li>
              <li>• <strong>Ollama</strong> — self-hosted LLM (Llama, Qwen, Mistral)</li>
              <li>• <strong>Docker</strong> — for fully self-hosted setup</li>
            </ul>
            <div className="mt-3 p-3 rounded-lg bg-base border border-line text-accent font-mono text-xs">
              <p># Deploy to Vercel</p>
              <p>npx vercel --prod</p>
              <br />
              <p># Set environment variables</p>
              <p>vercel env add DATABASE_URL</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
