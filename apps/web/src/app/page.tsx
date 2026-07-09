import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AnimatedCodeBackground } from '@/components/effects/animated-code-background'
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Mail,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="site-shell flex min-h-screen flex-col">
      <AnimatedCodeBackground intensity="hero" />

      <header className="site-header">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <Briefcase className="h-6 w-6" />
            <span className="text-xl font-bold">JobTourer</span>
          </Link>
          <nav className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-medium hover:underline">
              Login
            </Link>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative z-10 flex-1">
        <div className="container mx-auto grid min-h-[calc(100vh-8rem)] items-center gap-12 px-4 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] lg:py-20">
          <div className="max-w-3xl">
            <div className="hero-badge">
              <Sparkles className="h-4 w-4" />
              AI search agents for serious job hunts
            </div>
            <h1 className="mt-5 text-5xl font-bold tracking-tight lg:text-7xl">
              Automate Your Job Search with AI
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-muted-foreground">
              Let JobTourer find jobs, match them to your resume, and generate
              personalized application emails while your pipeline keeps moving.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>

          <div className="hero-console">
            <div className="hero-console-header">
              <span />
              <span />
              <span />
            </div>
            <div className="hero-console-body">
              <div className="hero-status">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                24 high-fit jobs synced
              </div>
              <div className="hero-match-meter">
                <div>
                  <span>Match confidence</span>
                  <strong>92%</strong>
                </div>
                <span className="hero-meter-track">
                  <span />
                </span>
              </div>
              <div className="hero-queue">
                <span>resume.scan()</span>
                <span>job.rank()</span>
                <span>email.draft()</span>
                <span>followup.schedule()</span>
              </div>
            </div>
          </div>

          <div className="feature-grid lg:col-span-2">
            <div className="feature-card">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">Automated Search</h3>
              <p className="text-sm text-muted-foreground">
                Searches multiple platforms nightly for relevant jobs
              </p>
            </div>
            <div className="feature-card">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">AI Matching</h3>
              <p className="text-sm text-muted-foreground">
                Calculates job compatibility with your resume
              </p>
            </div>
            <div className="feature-card">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">Email Generation</h3>
              <p className="text-sm text-muted-foreground">
                Creates personalized application emails with AI
              </p>
            </div>
            <div className="feature-card">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">Application Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Track all applications in one dashboard
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 JobTourer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
