import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'JobTourer - AI-Powered Job Application Automation',
  description: 'Automate your job search with AI-powered matching, email generation, and application tracking.',
  keywords: ['job search', 'automation', 'AI', 'career', 'employment'],
  authors: [{ name: 'JobTourer Team' }],
  openGraph: {
    title: 'JobTourer - AI-Powered Job Application Automation',
    description: 'Automate your job search with AI-powered matching, email generation, and application tracking.',
    url: 'https://jobtourer.com',
    siteName: 'JobTourer',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JobTourer - AI-Powered Job Application Automation',
    description: 'Automate your job search with AI-powered matching, email generation, and application tracking.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
