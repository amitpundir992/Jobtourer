import { ApplicationsList } from '@/components/applications/applications-list'
import { ApplicationsStats } from '@/components/applications/applications-stats'

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const rawSearch = Array.isArray(params.search)
    ? params.search[0]
    : params.search
  const search = rawSearch?.trim().slice(0, 100) ?? ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Applications</h1>
        <p className="text-muted-foreground">
          Track and manage your job applications
        </p>
      </div>

      <ApplicationsStats />
      <ApplicationsList search={search} />
    </div>
  )
}
