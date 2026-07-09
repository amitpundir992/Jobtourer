const jobs = [
  {
    company: 'Acme AI',
    role: 'Frontend Engineer',
    location: 'Remote',
    match: '92%',
  },
  {
    company: 'Northstar Labs',
    role: 'Full Stack Engineer',
    location: 'New York',
    match: '87%',
  },
  {
    company: 'Orbit Systems',
    role: 'Product Engineer',
    location: 'San Francisco',
    match: '81%',
  },
]

export function JobsTable() {
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
          {jobs.map((job) => (
            <tr
              key={`${job.company}-${job.role}`}
              className="border-b last:border-0"
            >
              <td className="px-4 py-3 font-medium">{job.role}</td>
              <td className="px-4 py-3">{job.company}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {job.location}
              </td>
              <td className="px-4 py-3 font-semibold text-green-600">
                {job.match}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
