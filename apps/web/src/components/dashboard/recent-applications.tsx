const applications = [
  { company: 'Acme AI', role: 'Frontend Engineer', status: 'Draft' },
  { company: 'Northstar Labs', role: 'Full Stack Engineer', status: 'Applied' },
  { company: 'Orbit Systems', role: 'Product Engineer', status: 'Interviewing' },
]

export function RecentApplications() {
  return (
    <section className="rounded-lg border bg-background p-5">
      <h2 className="text-base font-semibold">Recent applications</h2>
      <div className="mt-4 space-y-4">
        {applications.map((application) => (
          <div key={`${application.company}-${application.role}`} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{application.role}</p>
              <p className="text-sm text-muted-foreground">{application.company}</p>
            </div>
            <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
              {application.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
