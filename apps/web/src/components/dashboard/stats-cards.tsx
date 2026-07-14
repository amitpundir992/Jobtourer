import { Briefcase, FileCheck, Mail, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { prisma } from '@jobtourer/database'

import { getServerSession } from '@/lib/server-session'

const getStats = unstable_cache(
  async (userId: string) =>
    Promise.all([
      prisma.savedJob.aggregate({
        where: { user_id: userId },
        _count: { _all: true },
        _avg: { match_score: true },
      }),
      prisma.application.count({ where: { user_id: userId } }),
      prisma.emailDraft.count({
        where: { user_id: userId, status: 'draft' },
      }),
    ]),
  ['dashboard-stats-v1'],
  { revalidate: 30, tags: ['dashboard-data'] }
)

export async function StatsCards() {
  const session = await getServerSession()

  const [savedJobs, applications, draftEmails] = session
    ? await getStats(session.user.id)
    : [{ _count: { _all: 0 }, _avg: { match_score: null } }, 0, 0]

  const averageMatch =
    savedJobs._avg.match_score !== null
      ? `${Math.round(savedJobs._avg.match_score * 100)}%`
      : '-'

  const stats = [
    {
      label: 'Matched jobs',
      value: String(savedJobs._count._all),
      icon: Briefcase,
      href: '/jobs',
    },
    {
      label: 'Applications',
      value: String(applications),
      icon: FileCheck,
      href: '/applications',
    },
    {
      label: 'Draft emails',
      value: String(draftEmails),
      icon: Mail,
      href: '/applications',
    },
    {
      label: 'Avg. match',
      value: averageMatch,
      icon: TrendingUp,
      href: '/jobs?sort=match',
    },
  ]

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Link
          key={stat.label}
          className="dashboard-card group rounded-lg border p-5 transition-colors hover:border-primary/40"
          href={stat.href}
          prefetch
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <span className="dashboard-icon">
              <stat.icon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
        </Link>
      ))}
    </section>
  )
}
