import { JobsExplorer } from '@/components/jobs/jobs-explorer'
import { getJobCatalog, parseJobQuery } from '@/lib/job-query'
import { getServerSession } from '@/lib/server-session'

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = parseJobQuery(await searchParams)
  const session = await getServerSession()
  const catalog = session ? await getJobCatalog(session.user.id) : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Job Matches</h1>
        <p className="text-muted-foreground">
          AI-matched jobs based on your resume and preferences
        </p>
      </div>

      <JobsExplorer catalog={catalog} initialQuery={query} />
    </div>
  )
}
