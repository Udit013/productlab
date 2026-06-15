"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "../dashboard-layout"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, TrendingUp, AlertTriangle, CheckCircle, Target } from "lucide-react"
import { cn, statusColor } from "@/lib/utils"

interface Report {
  generatedAt: string
  type: string
  period: string
  productHealth: { score: number; trend: string; status: string }
  retention: { d1: number; d7: number; d30: number; d90: number }
  activation: { rate: number; benchmark: number; trend: string; topDropOff: string }
  experiments: { running: number; completed: number; winners: number; avgLift: string }
  goals: Array<{ id: string; name: string; status: string; currentValue: number; targetValue: number; unit: string }>
  risks: Array<{ name: string; severity: string; description: string }>
  recommendations: string[]
  topOpportunities: Array<{ name: string; opportunityScore: number; confidenceScore: number }>
  topInitiatives: Array<{ name: string; priorityScore: number; expectedRevenueLift: number; status: string }>
}

async function generatePDF(report: Report) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  // Header
  doc.setFillColor(79, 70, 229)
  doc.rect(0, 0, 220, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.text('ProductLab Executive Report', 14, 14)
  doc.setFontSize(10)
  doc.text(`${report.period} · Generated ${new Date(report.generatedAt).toLocaleDateString()}`, 14, 22)

  let y = 40
  doc.setTextColor(0, 0, 0)

  // Product Health
  doc.setFontSize(14)
  doc.text('Product Health', 14, y)
  y += 8
  doc.setFontSize(10)
  doc.text(`Overall Score: ${report.productHealth.score}/100 (${report.productHealth.trend} vs last period)`, 14, y)
  y += 5
  doc.text(`Status: ${report.productHealth.status}`, 14, y)
  y += 12

  // Retention
  doc.setFontSize(14)
  doc.text('Retention Metrics', 14, y)
  y += 8
  doc.setFontSize(10)
  doc.text(`D1: ${report.retention.d1}%  |  D7: ${report.retention.d7}%  |  D30: ${report.retention.d30}%  |  D90: ${report.retention.d90}%`, 14, y)
  y += 12

  // Activation
  doc.setFontSize(14)
  doc.text('Activation', 14, y)
  y += 8
  doc.setFontSize(10)
  doc.text(`Rate: ${report.activation.rate}% (benchmark: ${report.activation.benchmark}%)`, 14, y)
  y += 5
  doc.text(`${report.activation.topDropOff}`, 14, y)
  y += 12

  // Experiments
  doc.setFontSize(14)
  doc.text('Experimentation', 14, y)
  y += 8
  doc.setFontSize(10)
  doc.text(`${report.experiments.running} running · ${report.experiments.winners} winners · ${report.experiments.avgLift} avg lift`, 14, y)
  y += 12

  // Top Opportunities
  doc.setFontSize(14)
  doc.text('Top Opportunities', 14, y)
  y += 8
  doc.setFontSize(10)
  for (const opp of report.topOpportunities.slice(0, 5)) {
    doc.text(`• ${opp.name} (Score: ${opp.opportunityScore}, Confidence: ${opp.confidenceScore}%)`, 14, y)
    y += 6
  }
  y += 6

  // Recommendations
  doc.setFontSize(14)
  doc.text('Key Recommendations', 14, y)
  y += 8
  doc.setFontSize(10)
  for (const rec of report.recommendations) {
    doc.text(`→ ${rec}`, 14, y)
    y += 6
  }
  y += 6

  // Risks
  doc.setFontSize(14)
  doc.text('Strategic Risks', 14, y)
  y += 8
  doc.setFontSize(10)
  for (const risk of report.risks) {
    doc.setTextColor(risk.severity === 'high' ? 200 : 150, 0, 0)
    doc.text(`[${risk.severity.toUpperCase()}] ${risk.name}`, 14, y)
    y += 5
    doc.setTextColor(0, 0, 0)
    doc.text(risk.description, 18, y)
    y += 8
  }

  doc.save(`productlab-report-${report.type}-${new Date().toISOString().split('T')[0]}.pdf`)
}

export default function ReportsPage() {
  const [report, setReport] = useState<Report | null>(null)
  const [type, setType] = useState<'weekly' | 'monthly' | 'quarterly'>('weekly')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetch(`/api/reports?type=${type}`).then(r => r.json()).then(setReport)
  }, [type])

  async function handleDownload() {
    if (!report) return
    setGenerating(true)
    await generatePDF(report)
    setGenerating(false)
  }

  return (
    <DashboardLayout>
      <Topbar
        title="Executive Reports"
        subtitle="Weekly · Monthly · Quarterly product intelligence summaries"
        actions={
          <div className="flex items-center gap-2">
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleDownload} disabled={!report || generating}>
              <Download className="h-4 w-4 mr-1" />
              {generating ? 'Generating...' : 'Export PDF'}
            </Button>
          </div>
        }
      />
      <div className="p-6 space-y-6">
        {!report || !report.productHealth ? (
          <div className="text-center py-12 text-faint">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
            {report && !report.productHealth ? 'No data yet. Load demo data from the Decision Center.' : 'Loading report...'}
          </div>
        ) : (
          <>
            {/* Report header */}
            <div className="relative overflow-hidden rounded-lg border border-line bg-surface p-6 grid-texture">
              <div className="absolute inset-y-0 left-0 w-1 bg-accent" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="label-mono text-accent capitalize">{type} Report</p>
                  <h2 className="text-2xl font-bold mt-2 text-ink">{report.period}</h2>
                  <p className="text-sm text-muted mt-1">
                    Generated {new Date(report.generatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-5xl font-bold text-accent font-mono">{report.productHealth.score}</p>
                  <p className="label-mono text-faint mt-1">Product Health</p>
                  <p className="text-sm text-emerald-400 font-medium mt-0.5">{report.productHealth.trend} vs last period</p>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'D30 Retention', value: `${report.retention.d30}%`, sub: `D7: ${report.retention.d7}%`, icon: TrendingUp, color: 'text-accent' },
                { label: 'Activation Rate', value: `${report.activation.rate}%`, sub: `Benchmark: ${report.activation.benchmark}%`, icon: Target, color: 'text-emerald-600' },
                { label: 'Experiments Running', value: report.experiments.running, sub: `${report.experiments.winners} winners`, icon: FileText, color: 'text-violet-600' },
                { label: 'Avg Experiment Lift', value: `${report.experiments.avgLift}`, sub: `${report.experiments.completed} completed`, icon: TrendingUp, color: 'text-blue-600' },
              ].map(m => {
                const Icon = m.icon
                return (
                  <Card key={m.label}>
                    <CardContent className="p-4">
                      <Icon className={cn("h-5 w-5 mb-2", m.color)} />
                      <p className="text-2xl font-bold text-ink">{m.value}</p>
                      <p className="text-sm text-muted">{m.label}</p>
                      <p className="text-xs text-faint mt-0.5">{m.sub}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Risks */}
              <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Strategic Risks
                </CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {report.risks.map((risk, i) => (
                    <div key={i} className={cn(
                      "rounded-lg p-3 border",
                      risk.severity === 'high' ? 'bg-red-500/15 border-red-500/30' : 'bg-amber-500/15 border-amber-500/30'
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-bold uppercase",
                          risk.severity === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                        )}>
                          {risk.severity}
                        </span>
                        <p className="text-sm font-semibold text-ink">{risk.name}</p>
                      </div>
                      <p className="text-xs text-muted">{risk.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" /> Recommendations
                </CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {report.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/15 text-accent text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-sm text-ink-2">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Goals */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Goal Progress</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {report.goals.slice(0, 6).map(goal => (
                    <div key={goal.id} className="flex items-center justify-between py-2 border-b border-line last:border-0">
                      <span className="text-sm text-ink-2">{goal.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink">
                          {goal.currentValue}{goal.unit === '%' ? '%' : ''} / {goal.targetValue}{goal.unit === '%' ? '%' : ''}
                        </span>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full",
                          goal.status === 'on_track' ? 'bg-emerald-500/20 text-emerald-300' :
                            goal.status === 'at_risk' ? 'bg-amber-500/20 text-amber-300' :
                              'bg-red-500/20 text-red-300'
                        )}>
                          {goal.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top initiatives */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Top Initiatives by Priority</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {report.topInitiatives.map((init, i) => (
                    <div key={init.name} className="flex items-center gap-3 py-2 border-b border-line last:border-0">
                      <span className="text-xs font-bold text-faint w-4">#{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink">{init.name}</p>
                        <p className="text-xs text-emerald-600">
                          ${init.expectedRevenueLift.toLocaleString()}/yr expected
                        </p>
                      </div>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border", statusColor(init.status))}>
                        {init.status?.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-bold text-accent">{init.priorityScore}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
