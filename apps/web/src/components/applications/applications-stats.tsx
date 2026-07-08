const stats = [
  { label: 'Draft', value: 4 },
  { label: 'Applied', value: 8 },
  { label: 'Interviewing', value: 2 },
  { label: 'Offers', value: 1 },
]

export function ApplicationsStats() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-lg border bg-background p-4">
          <p className="text-sm text-muted-foreground">{stat.label}</p>
          <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
        </div>
      ))}
    </section>
  )
}
