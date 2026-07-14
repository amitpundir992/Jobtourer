import { formatDistanceToNow } from 'date-fns'
import { prisma } from '@jobtourer/database'
import { unstable_cache } from 'next/cache'

import { getServerSession } from '@/lib/server-session'

const getApplications = unstable_cache(
  (userId: string) =>
    prisma.application.findMany({
      where: { user_id: userId },
      include: { job: true },
      orderBy: { updated_at: 'desc' },
      take: 20,
    }),
  ['applications-list-v1'],
  { revalidate: 30, tags: ['application-data'] }
)

export async function ApplicationsList() {
  const session = await getServerSession()
  const applications = session ? await getApplications(session.user.id) : []

  return (
    <section className="rounded-lg border bg-background">
      {applications.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">
          No applications yet. Applications will appear here after you create
          drafts or mark jobs as applied.
        </div>
      ) : (
        applications.map((application) => (
          <div
            key={application.id}
            className="flex items-center justify-between gap-4 border-b p-4 last:border-0"
          >
            <div>
              <p className="font-medium">{application.job.title}</p>
              <p className="text-sm text-muted-foreground">
                {application.job.company}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{application.status}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(application.updated_at, {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        ))
      )}
    </section>
  )
}
