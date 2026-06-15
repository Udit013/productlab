"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Zap, BarChart3, FlaskConical, Target, ListOrdered,
  Map, Bot, FileText, Activity, Settings, Database, Terminal
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  {
    group: "Decisions",
    items: [
      { name: "Decision Center", href: "/", icon: LayoutDashboard, primary: true },
      { name: "Opportunities", href: "/opportunities", icon: Target },
      { name: "Prioritization", href: "/prioritization", icon: ListOrdered },
      { name: "Roadmap", href: "/roadmap", icon: Map },
    ],
  },
  {
    group: "Analytics",
    items: [
      { name: "Funnels", href: "/analytics/funnels", icon: BarChart3 },
      { name: "Cohorts", href: "/analytics/cohorts", icon: Activity },
      { name: "Adoption", href: "/analytics/adoption", icon: Zap },
      { name: "Segments", href: "/analytics/segments", icon: Activity },
    ],
  },
  {
    group: "Experiments",
    items: [
      { name: "Experiments", href: "/experiments", icon: FlaskConical },
    ],
  },
  {
    group: "Data",
    items: [
      { name: "Event Explorer", href: "/events", icon: Database },
    ],
  },
  {
    group: "Intelligence",
    items: [
      { name: "AI Advisor", href: "/advisor", icon: Bot },
      { name: "Reports", href: "/reports", icon: FileText },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-60 flex-col border-r border-line bg-surface">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-line px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-accent/40 bg-accent/10">
          <Terminal className="h-4 w-4 text-accent" />
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-ink">ProductLab</span>
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          </div>
          <p className="label-mono text-faint">Decision Intelligence</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-5">
        {navigation.map((group) => (
          <div key={group.group}>
            <p className="label-mono mb-2 px-2 text-faint">{group.group}</p>
            <ul className="space-y-px">
              {group.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href))
                const Icon = item.icon
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-surface-2 text-ink"
                          : "text-muted hover:bg-surface-2/60 hover:text-ink-2"
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
                      )}
                      <Icon className={cn(
                        "h-4 w-4 flex-shrink-0 transition-colors",
                        isActive ? "text-accent" : "text-faint group-hover:text-muted"
                      )} />
                      <span className="flex-1">{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-line p-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            pathname === "/settings" ? "bg-surface-2 text-ink" : "text-muted hover:bg-surface-2/60 hover:text-ink-2"
          )}
        >
          <Settings className="h-4 w-4 text-faint" />
          Settings
        </Link>
        <div className="mt-2 rounded-md border border-line bg-base px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <p className="label-mono text-accent">Demo Active</p>
          </div>
          <p className="mt-1 font-mono text-[11px] text-faint">10K users · 100K+ events</p>
        </div>
      </div>
    </div>
  )
}
