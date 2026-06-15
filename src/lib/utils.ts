import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`
}

export function scoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-400'
  if (score >= 70) return 'text-amber-400'
  if (score >= 50) return 'text-orange-400'
  return 'text-red-400'
}

export function scoreBadgeColor(score: number): string {
  if (score >= 85) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  if (score >= 70) return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  if (score >= 50) return 'bg-orange-500/15 text-orange-300 border-orange-500/30'
  return 'bg-red-500/15 text-red-300 border-red-500/30'
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    winner: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    running: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    inconclusive: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    loser: 'bg-red-500/15 text-red-300 border-red-500/30',
    completed: 'bg-surface-2 text-ink-2 border-line',
    draft: 'bg-surface-2 text-muted border-line',
    in_progress: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    planned: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    backlog: 'bg-surface-2 text-muted border-line',
    on_track: 'bg-emerald-500/15 text-emerald-300',
    at_risk: 'bg-amber-500/15 text-amber-300',
    off_track: 'bg-red-500/15 text-red-300',
    active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  }
  return map[status] ?? 'bg-surface-2 text-muted border-line'
}

export function relativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString()
}

export function getQuarters(): string[] {
  return ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025']
}
