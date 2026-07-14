import { prisma } from '@jobtourer/database'
import { unstable_cache } from 'next/cache'

import { getServerSession } from '@/lib/server-session'

const getRecentApplications = unstable_cache(
  (userId: string) =>
    prisma.application.findMany({
      where: { user_id: userId },
      include: { job: true },
      orderBy: { updated_at: 'desc' },
      take: 5,
    }),
  ['dashboard-recent-applications-v1'],
  { revalidate: 30, tags: ['dashboard-data'] }
)

export async function RecentApplications() {
  const session = await getServerSession()
  const applications = session
    ? await getRecentApplications(session.user.id)
    : []

  return (
    <section className="dashboard-card rounded-lg border p-5">
      <h2 className="text-base font-semibold">Recent applications</h2>
      <div className="mt-4 space-y-4">
        {applications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No applications yet.</p>
        ) : (
          applications.map((application) => (
            <div
              key={application.id}
              className="dashboard-list-row flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-medium">{application.job.title}</p>
                <p className="text-sm text-muted-foreground">
                  {application.job.company}
                </p>
              </div>
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                {application.status}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
