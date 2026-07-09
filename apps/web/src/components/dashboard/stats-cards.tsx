import { Briefcase, FileCheck, Mail, TrendingUp } from 'lucide-react'

const stats = [
  { label: 'Matched jobs', value: '24', icon: Briefcase },
  { label: 'Applications', value: '8', icon: FileCheck },
  { label: 'Draft emails', value: '5', icon: Mail },
  { label: 'Avg. match', value: '82%', icon: TrendingUp },
]

export function StatsCards() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="dashboard-card group rounded-lg border p-5">
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
