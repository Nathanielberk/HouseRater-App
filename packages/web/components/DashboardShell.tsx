'use client'

import { ReactNode } from 'react'
import { Sidebar, BottomNav } from './navigation'

interface DashboardShellProps {
  children: ReactNode
  householdName?: string
  userName?: string
  userEmail?: string
}

export default function DashboardShell({
  children,
  householdName,
  userName,
  userEmail,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Desktop Sidebar */}
      <Sidebar
        householdName={householdName}
        userName={userName}
        userEmail={userEmail}
      />

      {/* Main Content Area */}
      <main className="lg:pl-64 pb-20 lg:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
