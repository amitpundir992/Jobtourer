import { JobsTable } from '@/components/jobs/jobs-table'
import { JobsFilters } from '@/components/jobs/jobs-filters'
import { parseJobQuery } from '@/lib/job-query'

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = parseJobQuery(await searchParams)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Job Matches</h1>
        <p className="text-muted-foreground">
          AI-matched jobs based on your resume and preferences
        </p>
      </div>

      <JobsFilters query={query} />
      <JobsTable query={query} />
    </div>
  )
}
