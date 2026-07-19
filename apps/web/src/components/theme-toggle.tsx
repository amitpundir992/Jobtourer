'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, Laptop, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const themes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Laptop },
] as const

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const ActiveIcon = mounted && resolvedTheme === 'dark' ? Moon : Sun

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          className={cn('theme-toggle', className)}
          variant="ghost"
          size="icon"
          aria-label="Choose appearance"
          title="Choose appearance"
          disabled={!mounted}
        >
          <ActiveIcon className="h-4 w-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-[100] min-w-36 rounded-md border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          {themes.map((option) => {
            const Icon = option.icon
            const selected = theme === option.value

            return (
              <DropdownMenu.Item
                key={option.value}
                className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
                onSelect={() => setTheme(option.value)}
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{option.label}</span>
                {selected ? <Check className="h-4 w-4" /> : null}
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
