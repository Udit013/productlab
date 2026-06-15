"use client"

import { Sidebar } from "@/components/layout/sidebar"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full bg-base">
      <Sidebar />
      <main className="flex-1 overflow-y-auto grid-texture">
        {children}
      </main>
    </div>
  )
}
