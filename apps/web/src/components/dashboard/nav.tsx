import Link from 'next/link'
import { Briefcase, FileText, Home, Send, Settings } from 'lucide-react'

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/applications', label: 'Applications', icon: Send },
  { href: '/resumes', label: 'Resumes', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function DashboardNav() {
  return (
    <aside className="dashboard-nav hidden w-64 p-4 md:block">
      <Link href="/dashboard" className="mb-8 flex items-center gap-2 text-xl font-semibold">
        <span className="dashboard-logo-mark">
          <Briefcase className="h-4 w-4" />
        </span>
        <span>JobTourer</span>
      </Link>
      <nav className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="dashboard-nav-link flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
