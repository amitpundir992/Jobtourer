import { JobsTable } from '@/components/jobs/jobs-table'
import { JobsFilters } from '@/components/jobs/jobs-filters'

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Job Matches</h1>
        <p className="text-muted-foreground">
          AI-matched jobs based on your resume and preferences
        </p>
      </div>

      <JobsFilters />
      <JobsTable />
    </div>
  )
}
