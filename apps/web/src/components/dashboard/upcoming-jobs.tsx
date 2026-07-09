const jobs = [
  { company: 'CloudPeak', role: 'Senior React Engineer', match: '91%' },
  { company: 'LedgerWorks', role: 'Node.js Engineer', match: '86%' },
  { company: 'BrightHire', role: 'Platform Engineer', match: '79%' },
]

export function UpcomingJobs() {
  return (
    <section className="dashboard-card rounded-lg border p-5">
      <h2 className="text-base font-semibold">Top matches</h2>
      <div className="mt-4 space-y-4">
        {jobs.map((job) => (
          <div key={`${job.company}-${job.role}`} className="dashboard-list-row flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{job.role}</p>
              <p className="text-sm text-muted-foreground">{job.company}</p>
            </div>
            <span className="text-sm font-semibold text-green-600">{job.match}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
