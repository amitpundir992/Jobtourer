'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { AlertCircle, ArrowRight, Briefcase, Chrome, Github, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'

type AuthMode = 'login' | 'signup'

interface AuthFormProps {
  mode: AuthMode
}

const content = {
  login: {
    eyebrow: 'Welcome back',
    title: 'Sign in to JobTourer',
    subtitle: 'Review matches, track applications, and continue your job search workflow.',
    submit: 'Sign in',
    switchText: 'New to JobTourer?',
    switchHref: '/signup',
    switchLabel: 'Create an account',
    endpoint: '/api/auth/login',
  },
  signup: {
    eyebrow: 'Start free',
    title: 'Create your JobTourer account',
    subtitle: 'Set up your workspace for AI job matching, resume management, and application tracking.',
    submit: 'Create account',
    switchText: 'Already have an account?',
    switchHref: '/login',
    switchLabel: 'Sign in',
    endpoint: '/api/auth/register',
  },
} satisfies Record<AuthMode, Record<string, string>>

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const copy = content[mode]
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [socialProvider, setSocialProvider] = useState<'google' | 'github' | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '')
    const password = String(formData.get('password') || '')

    try {
      const result =
        mode === 'signup'
          ? await authClient.signUp.email({
              name: String(formData.get('name') || ''),
              email,
              password,
              callbackURL: '/dashboard',
            })
          : await authClient.signIn.email({
              email,
              password,
              callbackURL: '/dashboard',
              rememberMe: true,
            })

      if (result.error) {
        throw new Error(result.error.message || 'Authentication failed')
      }

      router.replace('/dashboard')
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Authentication failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function onSocialSignIn(provider: 'google' | 'github') {
    setError(null)
    setSocialProvider(provider)

    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: '/dashboard',
        errorCallbackURL: mode === 'signup' ? '/signup' : '/login',
        newUserCallbackURL: '/dashboard',
      })

      if (result.error) {
        throw new Error(result.error.message || `Could not continue with ${provider}`)
      }
    } catch (caughtError) {
      setSocialProvider(null)
      setError(caughtError instanceof Error ? caughtError.message : `Could not continue with ${provider}`)
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-background" aria-hidden="true">
        <span className="auth-grid" />
        <span className="auth-sweep auth-sweep-one" />
        <span className="auth-sweep auth-sweep-two" />
      </div>

      <div className="auth-layout">
        <section className="auth-brand-panel">
          <Link href="/" className="auth-logo">
            <span className="auth-logo-mark">
              <Briefcase className="h-5 w-5" />
            </span>
            JobTourer
          </Link>

          <div className="auth-brand-copy">
            <p className="auth-eyebrow">{copy.eyebrow}</p>
            <h1 className="auth-headline">
              AI-assisted job search, organized from first match to final follow-up.
            </h1>
            <div className="auth-metrics">
              <div className="auth-metric">
                <span>24</span>
                matched jobs tracked
              </div>
              <div className="auth-metric">
                <span>82%</span>
                average match score
              </div>
              <div className="auth-metric">
                <span>5</span>
                drafts ready to review
              </div>
            </div>
          </div>

          <p className="auth-footnote">
            Built for focused application workflows, background search, and reusable resumes.
          </p>
        </section>

        <section className="auth-form-panel">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2>{copy.title}</h2>
              <p>{copy.subtitle}</p>
            </div>

            {error ? (
              <div className="auth-error">
                <AlertCircle className="h-4 w-4 flex-none" />
                <p>{error}</p>
              </div>
            ) : null}

            <div className="auth-social-grid" aria-label="Social sign in options">
              <button
                className="auth-social-button"
                type="button"
                onClick={() => onSocialSignIn('google')}
                disabled={isSubmitting || socialProvider !== null}
              >
                {socialProvider === 'google' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Chrome className="h-4 w-4" />
                )}
                Google
              </button>
              <button
                className="auth-social-button"
                type="button"
                onClick={() => onSocialSignIn('github')}
                disabled={isSubmitting || socialProvider !== null}
              >
                {socialProvider === 'github' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Github className="h-4 w-4" />
                )}
                GitHub
              </button>
            </div>

            <div className="auth-divider">
              <span>or continue with email</span>
            </div>

            <form className="auth-form" onSubmit={onSubmit}>
              {mode === 'signup' ? (
                <label className="auth-field">
                  <span>Full name</span>
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    minLength={2}
                    placeholder="Amit Pundir"
                  />
                </label>
              ) : null}

              <label className="auth-field">
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                />
              </label>

              <label className="auth-field">
                <span>Password</span>
                <input
                  name="password"
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                />
              </label>

              <Button className="auth-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                {copy.submit}
              </Button>
            </form>

            <p className="auth-switch">
              {copy.switchText}{' '}
              <Link href={copy.switchHref}>
                {copy.switchLabel}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
