import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentApplications } from '@/components/dashboard/recent-applications'
import { UpcomingJobs } from '@/components/dashboard/upcoming-jobs'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="dashboard-hero">
        <div>
          <p className="text-sm font-semibold text-primary">Live workspace</p>
          <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your job search.
        </p>
        <div className="dashboard-hero-pulse" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>

      <StatsCards />

      <div className="grid gap-6 md:grid-cols-2">
        <RecentApplications />
        <UpcomingJobs />
      </div>
    </div>
  )
}
