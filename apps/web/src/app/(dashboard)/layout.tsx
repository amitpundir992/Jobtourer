import { DashboardNav } from '@/components/dashboard/nav'
import { DashboardHeader } from '@/components/dashboard/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <div className="flex-1">
        <DashboardHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
