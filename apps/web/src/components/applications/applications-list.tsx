const applications = [
  { company: 'Acme AI', role: 'Frontend Engineer', status: 'Draft', updated: 'Today' },
  { company: 'Northstar Labs', role: 'Full Stack Engineer', status: 'Applied', updated: 'Yesterday' },
  { company: 'Orbit Systems', role: 'Product Engineer', status: 'Interviewing', updated: 'Jul 6' },
]

export function ApplicationsList() {
  return (
    <section className="rounded-lg border bg-background">
      {applications.map((application) => (
        <div
          key={`${application.company}-${application.role}`}
          className="flex items-center justify-between gap-4 border-b p-4 last:border-0"
        >
          <div>
            <p className="font-medium">{application.role}</p>
            <p className="text-sm text-muted-foreground">{application.company}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{application.status}</p>
            <p className="text-xs text-muted-foreground">{application.updated}</p>
          </div>
        </div>
      ))}
    </section>
  )
}
