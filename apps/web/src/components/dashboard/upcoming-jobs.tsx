import { headers } from 'next/headers'
import { prisma } from '@jobtourer/database'

import { auth } from '@/lib/auth'

export async function UpcomingJobs() {
  const session = await auth.api.getSession({ headers: await headers() })
  const jobs = session
    ? await prisma.savedJob.findMany({
        where: { user_id: session.user.id },
        include: { job: true },
        orderBy: { match_score: 'desc' },
        take: 5,
      })
    : []

  return (
    <section className="dashboard-card rounded-lg border p-5">
      <h2 className="text-base font-semibold">Top matches</h2>
      <div className="mt-4 space-y-4">
        {jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matched jobs yet.</p>
        ) : (
          jobs.map((savedJob) => (
            <div
              key={savedJob.id}
              className="dashboard-list-row flex items-center justify-between gap-4"
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
            </div>
          ))
        )}
      </div>
    </section>
  )
}
