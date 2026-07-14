import { redirect } from 'next/navigation'

import { AuthForm } from '@/components/auth/auth-form'
import { getServerSession } from '@/lib/server-session'

export default async function SignupPage() {
  const session = await getServerSession()

  if (session) {
    redirect('/dashboard')
  }

  return <AuthForm mode="signup" />
}
