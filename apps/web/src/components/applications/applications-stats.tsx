import { prisma } from '@jobtourer/database'
import { unstable_cache } from 'next/cache'

import { getServerSession } from '@/lib/server-session'

const statusCards = [
  { label: 'Draft', status: 'draft' },
  { label: 'Applied', status: 'applied' },
  { label: 'Interviewing', status: 'interviewing' },
  { label: 'Offers', status: 'offered' },
]

const getApplicationCounts = unstable_cache(
  async (userId: string) => {
    const grouped = await prisma.application.groupBy({
      by: ['status'],
      where: { user_id: userId },
      _count: { _all: true },
    })
    return grouped.map((item) => ({
      status: item.status,
      count: item._count._all,
    }))
  },
  ['application-counts-v1'],
  { revalidate: 30, tags: ['application-data'] }
)

export async function ApplicationsStats() {
  const session = await getServerSession()

  const grouped = session
    ? await getApplicationCounts(session.user.id)
    : []

  const counts = new Map(
    grouped.map((item) => [item.status, item.count])
  )

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statusCards.map((stat) => (
        <div key={stat.label} className="rounded-lg border bg-background p-4">
          <p className="text-sm text-muted-foreground">{stat.label}</p>
          <p className="mt-2 text-2xl font-semibold">
            {counts.get(stat.status) ?? 0}
          </p>
        </div>
      ))}
    </section>
  )
}
