import { Bell, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function DashboardHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Search jobs, companies, applications"
          type="search"
        />
      </div>
      <Button variant="ghost" size="icon" aria-label="Notifications">
        <Bell className="h-4 w-4" />
      </Button>
    </header>
  )
}
