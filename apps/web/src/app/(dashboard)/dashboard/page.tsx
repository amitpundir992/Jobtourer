import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentApplications } from '@/components/dashboard/recent-applications'
import { UpcomingJobs } from '@/components/dashboard/upcoming-jobs'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your job search.
        </p>
      </div>

      <StatsCards />

      <div className="grid gap-6 md:grid-cols-2">
        <RecentApplications />
        <UpcomingJobs />
      </div>
    </div>
  )
}
