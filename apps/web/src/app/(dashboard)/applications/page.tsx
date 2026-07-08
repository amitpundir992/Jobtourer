import { ApplicationsList } from '@/components/applications/applications-list'
import { ApplicationsStats } from '@/components/applications/applications-stats'

export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Applications</h1>
        <p className="text-muted-foreground">
          Track and manage your job applications
        </p>
      </div>

      <ApplicationsStats />
      <ApplicationsList />
    </div>
  )
}
