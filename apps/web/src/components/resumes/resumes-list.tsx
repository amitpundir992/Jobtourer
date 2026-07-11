'use client'

import { FileText } from 'lucide-react'

import { useResumes } from '@/hooks/use-resumes'
import type { Resume } from '@jobtourer/types'

export function ResumesList() {
  const { data: resumes = [], isLoading, error } = useResumes()

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading resume...</p>
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">
        Could not load your resume. Please try again.
      </p>
    )
  }

  if (resumes.length === 0) {
    return (
      <section className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
        Upload your primary resume as a PDF or DOCX.
      </section>
    )
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {resumes.map((resume: Resume) => (
        <div key={resume.id} className="rounded-lg border bg-background p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <FileText className="h-5 w-5 flex-none text-muted-foreground" />
              <div className="min-w-0">
                <h2 className="font-semibold">{resume.title}</h2>
                <a
                  className="block truncate text-sm text-muted-foreground hover:text-foreground"
                  href={resume.file_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {resume.file_name}
                </a>
              </div>
            </div>
            <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
              {resume.is_default ? 'Default' : 'Ready'}
            </span>
          </div>
        </div>
      ))}
    </section>
  )
}
