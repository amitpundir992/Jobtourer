export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-label="Loading page" role="status">
      <div className="h-20 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="h-28 animate-pulse rounded-md border bg-muted/60"
            key={index}
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-md border bg-muted/60" />
    </div>
  )
}
