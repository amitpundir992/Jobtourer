import { redirect } from 'next/navigation'

import { DashboardNav } from '@/components/dashboard/nav'
import { DashboardHeader } from '@/components/dashboard/header'
import { AnimatedCodeBackground } from '@/components/effects/animated-code-background'
import { getServerSession } from '@/lib/server-session'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="dashboard-shell flex min-h-screen">
      <AnimatedCodeBackground className="dashboard-background" />
      <DashboardNav />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
