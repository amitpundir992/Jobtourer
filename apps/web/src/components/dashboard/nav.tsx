'use client'

import * as Dialog from '@radix-ui/react-dialog'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Briefcase,
  FileText,
  Home,
  Menu,
  Send,
  Settings,
  X,
} from 'lucide-react'

import { LogoutButton } from '@/components/auth/logout-button'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/applications', label: 'Applications', icon: Send },
  { href: '/resumes', label: 'Resumes', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname()

  return items.map((item) => {
    const active = pathname === item.href
    const link = (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'dashboard-nav-link flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
          active
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.label}
      </Link>
    )

    return mobile ? (
      <Dialog.Close asChild key={item.href}>
        {link}
      </Dialog.Close>
    ) : (
      link
    )
  })
}

export function DashboardNav() {
  return (
    <aside className="dashboard-nav hidden w-64 flex-col p-4 md:flex">
      <Link
        href="/dashboard"
        className="mb-8 flex items-center gap-2 text-xl font-semibold"
      >
        <span className="dashboard-logo-mark">
          <Briefcase className="h-4 w-4" />
        </span>
        <span>JobTourer</span>
      </Link>
      <nav className="flex-1 space-y-1">
        <NavigationLinks />
      </nav>
      <div className="border-t pt-3">
        <LogoutButton />
      </div>
    </aside>
  )
}

export function MobileDashboardNav() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button
          className="flex-none md:hidden"
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          title="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 md:hidden" />
        <Dialog.Content className="dashboard-nav fixed inset-y-0 left-0 z-[60] flex w-[min(18rem,86vw)] flex-col border-r p-4 shadow-2xl data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left md:hidden">
          <Dialog.Title className="sr-only">Navigation</Dialog.Title>
          <Dialog.Description className="sr-only">
            Navigate between JobTourer modules.
          </Dialog.Description>

          <div className="mb-8 flex items-center justify-between gap-3">
            <Dialog.Close asChild>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-xl font-semibold"
              >
                <span className="dashboard-logo-mark">
                  <Briefcase className="h-4 w-4" />
                </span>
                <span>JobTourer</span>
              </Link>
            </Dialog.Close>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close navigation"
                title="Close navigation"
              >
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>

          <nav className="flex-1 space-y-1">
            <NavigationLinks mobile />
          </nav>
          <div className="border-t pt-3">
            <LogoutButton />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
