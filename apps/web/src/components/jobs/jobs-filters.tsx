import { Search, SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function JobsFilters() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-background p-4 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Search roles, companies, locations"
          type="search"
        />
      </div>
      <Button variant="outline" type="button">
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        Filters
      </Button>
    </div>
  )
}
