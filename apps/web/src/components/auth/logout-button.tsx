'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogout() {
    setIsLoading(true)
    try {
      await authClient.signOut()
      router.replace('/login')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      aria-label="Log out"
      className={compact ? undefined : 'w-full justify-start'}
      disabled={isLoading}
      onClick={handleLogout}
      type="button"
      size={compact ? 'icon' : 'default'}
      title={compact ? 'Log out' : undefined}
      variant="ghost"
    >
      {isLoading ? (
        <Loader2 className={`${compact ? '' : 'mr-3'} h-4 w-4 animate-spin`} />
      ) : (
        <LogOut className={`${compact ? '' : 'mr-3'} h-4 w-4`} />
      )}
      {compact ? null : isLoading ? 'Signing out...' : 'Log out'}
    </Button>
  )
}
