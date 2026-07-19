import { prisma } from '@jobtourer/database'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'

import { getServerSession } from '@/lib/server-session'

const getTopMatches = unstable_cache(
  (userId: string) =>
    prisma.savedJob.findMany({
      where: { user_id: userId },
      include: { job: true },
      orderBy: { match_score: 'desc' },
      take: 5,
    }),
  ['dashboard-top-matches-v1'],
  { revalidate: 30, tags: ['dashboard-data'] }
)

export async function UpcomingJobs() {
  const session = await getServerSession()
  const jobs = session ? await getTopMatches(session.user.id) : []

  return (
    <section className="dashboard-card rounded-lg border p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold">Top matches</h2>
        <Link
          className="text-sm text-primary hover:underline"
          href="/jobs?sort=match"
        >
          View all
        </Link>
      </div>
      <div className="mt-4 space-y-4">
        {jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matched jobs yet.</p>
        ) : (
          jobs.map((savedJob) => (
            <a
              key={savedJob.id}
              className="dashboard-list-row flex items-center justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-ring"
              href={savedJob.job.url}
              rel="noreferrer"
              target="_blank"
            >
              <div>
                <p className="font-medium">{savedJob.job.title}</p>
                <p className="text-sm text-muted-foreground">
                  {savedJob.job.company}
                </p>
              </div>
              <span className="text-sm font-semibold text-green-600">
                {savedJob.match_score
                  ? `${Math.round(savedJob.match_score * 100)}%`
                  : '-'}
              </span>
            </a>
          ))
        )}
      </div>
    </section>
  )
}
