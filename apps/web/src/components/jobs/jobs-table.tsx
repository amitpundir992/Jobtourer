import { headers } from 'next/headers'
import { prisma } from '@jobtourer/database'

import { auth } from '@/lib/auth'

const sourceDetails: Record<string, { label: string; url: string }> = {
  greenhouse: { label: 'Greenhouse', url: 'https://www.greenhouse.com' },
  lever: { label: 'Lever', url: 'https://www.lever.co' },
  remoteok: { label: 'Remote OK', url: 'https://remoteok.com' },
}

export async function JobsTable() {
  const session = await auth.api.getSession({ headers: await headers() })
  const recommendations = session
    ? await prisma.savedJob.findMany({
        where: { user_id: session.user.id, job: { status: 'active' } },
        include: { job: true },
        orderBy: { match_score: 'desc' },
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
            <th className="px-4 py-3 font-medium">Source</th>
            <th className="px-4 py-3 font-medium">Match</th>
          </tr>
        </thead>
        <tbody>
          {recommendations.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                No job matches yet. Select Find recommendations to search for
                real jobs using your profile and resume.
              </td>
            </tr>
          ) : (
            recommendations.map((recommendation) => (
              <tr key={recommendation.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">
                  <a
                    className="hover:underline"
                    href={recommendation.job.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {recommendation.job.title}
                  </a>
                </td>
                <td className="px-4 py-3">{recommendation.job.company}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {recommendation.job.location ?? '-'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <a
                    className="hover:underline"
                    href={
                      sourceDetails[recommendation.job.source]?.url ??
                      recommendation.job.url
                    }
                    target="_blank"
                  >
                    {sourceDetails[recommendation.job.source]?.label ??
                      recommendation.job.source}
                  </a>
                </td>
                <td className="px-4 py-3 font-semibold text-green-600">
                  {recommendation.match_score !== null
                    ? `${Math.round(recommendation.match_score * 100)}%`
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
