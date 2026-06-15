"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-line bg-base/80 px-6 backdrop-blur">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-accent" />
          <h1 className="text-lg font-bold tracking-tight text-ink">{title}</h1>
        </div>
        {subtitle && <p className="label-mono mt-0.5 text-faint">{subtitle}</p>}
      </div>
      {actions}
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Bell className="h-4 w-4 text-faint" />
      </Button>
    </header>
  )
}
