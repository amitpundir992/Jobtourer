import { Briefcase, FileCheck, Mail, TrendingUp } from 'lucide-react'
import { headers } from 'next/headers'
import { prisma } from '@jobtourer/database'

import { auth } from '@/lib/auth'

export async function StatsCards() {
  const session = await auth.api.getSession({ headers: await headers() })

  const [matchedJobs, applications, draftEmails, savedJobs] = session
    ? await Promise.all([
        prisma.savedJob.count({ where: { user_id: session.user.id } }),
        prisma.application.count({ where: { user_id: session.user.id } }),
        prisma.emailDraft.count({
          where: { user_id: session.user.id, status: 'draft' },
        }),
        prisma.savedJob.findMany({
          where: { user_id: session.user.id, match_score: { not: null } },
          select: { match_score: true },
        }),
      ])
    : [0, 0, 0, []]

  const averageMatch =
    savedJobs.length > 0
      ? `${Math.round(
          (savedJobs.reduce((sum, job) => sum + (job.match_score ?? 0), 0) /
            savedJobs.length) *
            100
        )}%`
      : '-'

  const stats = [
    { label: 'Matched jobs', value: String(matchedJobs), icon: Briefcase },
    { label: 'Applications', value: String(applications), icon: FileCheck },
    { label: 'Draft emails', value: String(draftEmails), icon: Mail },
    { label: 'Avg. match', value: averageMatch, icon: TrendingUp },
  ]

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="dashboard-card group rounded-lg border p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <span className="dashboard-icon">
              <stat.icon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
        </div>
      ))}
    </section>
  )
}
