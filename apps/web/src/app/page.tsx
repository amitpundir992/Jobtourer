import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Briefcase, Mail, Target, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
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

      {/* Hero Section */}
      <section className="flex-1">
        <div className="container mx-auto px-4 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-5xl font-bold tracking-tight lg:text-6xl">
              Automate Your Job Search with AI
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Let JobTourer find jobs, match them to your resume, and generate personalized application emails - all while you sleep.
            </p>
            <div className="flex justify-center gap-4">
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

          {/* Features Grid */}
          <div className="mx-auto mt-24 grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">Automated Search</h3>
              <p className="text-sm text-muted-foreground">
                Searches multiple platforms nightly for relevant jobs
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">AI Matching</h3>
              <p className="text-sm text-muted-foreground">
                Calculates job compatibility with your resume
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">Email Generation</h3>
              <p className="text-sm text-muted-foreground">
                Creates personalized application emails with AI
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
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

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 JobTourer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
