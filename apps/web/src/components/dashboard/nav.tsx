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
    <aside className="hidden w-64 border-r bg-background p-4 md:block">
      <Link href="/dashboard" className="mb-8 block text-xl font-semibold">
        JobTourer
      </Link>
      <nav className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
