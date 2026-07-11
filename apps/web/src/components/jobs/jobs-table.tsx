import { headers } from 'next/headers'
import { prisma } from '@jobtourer/database'

import { auth } from '@/lib/auth'

export async function JobsTable() {
  const session = await auth.api.getSession({ headers: await headers() })
  const jobs = session
    ? await prisma.job.findMany({
        where: { status: 'active' },
        include: {
          saved_jobs: {
            where: { user_id: session.user.id },
            select: { match_score: true },
          },
        },
        orderBy: { created_at: 'desc' },
        take: 25,
      })
    : []

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Location</th>
            <th className="px-4 py-3 font-medium">Match</th>
          </tr>
        </thead>
        <tbody>
          {jobs.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-muted-foreground" colSpan={4}>
                No job matches yet. Jobs will appear here after your search
                automation or manual import saves real job records.
              </td>
            </tr>
          ) : (
            jobs.map((job) => (
              <tr key={job.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{job.title}</td>
              <td className="px-4 py-3">{job.company}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {job.location}
              </td>
              <td className="px-4 py-3 font-semibold text-green-600">
                {job.saved_jobs[0]?.match_score
                  ? `${Math.round(job.saved_jobs[0].match_score * 100)}%`
                  : '-'}
              </td>
            </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
