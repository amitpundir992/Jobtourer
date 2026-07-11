import { headers } from 'next/headers'
import { prisma } from '@jobtourer/database'

import { auth } from '@/lib/auth'

const statusCards = [
  { label: 'Draft', status: 'draft' },
  { label: 'Applied', status: 'applied' },
  { label: 'Interviewing', status: 'interviewing' },
  { label: 'Offers', status: 'offered' },
]

export async function ApplicationsStats() {
  const session = await auth.api.getSession({ headers: await headers() })

  const grouped = session
    ? await prisma.application.groupBy({
        by: ['status'],
        where: { user_id: session.user.id },
        _count: { _all: true },
      })
    : []

  const counts = new Map(
    grouped.map((item) => [item.status, item._count._all])
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
