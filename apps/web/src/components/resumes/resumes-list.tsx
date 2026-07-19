'use client'

import { FileText } from 'lucide-react'

import { useResumes } from '@/hooks/use-resumes'
import type { Resume } from '@jobtourer/database'
import type { ParsedResumeData } from '@jobtourer/types'

function getParsedData(resume: Resume) {
  return resume.parsed_data as ParsedResumeData | null | undefined
}

function isParsed(
  parsedData: ParsedResumeData | null | undefined
): parsedData is ParsedResumeData {
  return Boolean(parsedData?.parse_status === 'parsed' && parsedData.raw_text)
}

function getRawPreview(parsedData: ParsedResumeData) {
  return parsedData.raw_text?.replace(/\s+/g, ' ').trim().slice(0, 420)
}

export function ResumesList({ initialResumes }: { initialResumes: Resume[] }) {
  const { data: resumes = [], isLoading, error } = useResumes(initialResumes)

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
      {resumes.map((resume: Resume) => {
        const parsedData = getParsedData(resume)
        const parsed = isParsed(parsedData)
        const rawPreview = parsedData ? getRawPreview(parsedData) : undefined
        const parseMessage =
          parsedData?.parse_error ??
          'Resume uploaded. Parsed details will appear here after extraction succeeds.'

        return (
          <div key={resume.id} className="rounded-lg border bg-background p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-5 w-5 flex-none text-muted-foreground" />
                <div className="min-w-0">
                  <h2 className="font-semibold">{resume.title}</h2>
                  <a
                    className="block truncate text-sm text-muted-foreground hover:text-foreground"
                    href={`/api/resumes/${resume.id}/file`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {resume.file_name}
                  </a>
                </div>
              </div>
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                {parsed ? 'Parsed' : resume.is_default ? 'Default' : 'Ready'}
              </span>
            </div>

            {parsed ? (
              <div className="mt-5 space-y-4 border-t pt-4">
                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                  <span>{parsedData.skills?.length ?? 0} skills</span>
                  <span>
                    {parsedData.experience?.length ?? 0} experience items
                  </span>
                  <span>{parsedData.projects?.length ?? 0} projects</span>
                </div>

                {parsedData.summary ? (
                  <div>
                    <h3 className="text-sm font-medium">Summary</h3>
                    <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                      {parsedData.summary}
                    </p>
                  </div>
                ) : null}

                {parsedData.skills?.length ? (
                  <div>
                    <h3 className="text-sm font-medium">Skills</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {parsedData.skills.slice(0, 12).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-md bg-muted px-2 py-1 text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {parsedData.projects?.length ? (
                  <div>
                    <h3 className="text-sm font-medium">Projects</h3>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                      {parsedData.projects.slice(0, 3).map((project) => (
                        <li key={project}>{project}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {rawPreview &&
                !parsedData.summary &&
                !parsedData.skills?.length ? (
                  <div>
                    <h3 className="text-sm font-medium">
                      Extracted text preview
                    </h3>
                    <p className="mt-1 line-clamp-4 text-sm text-muted-foreground">
                      {rawPreview}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">
                {parseMessage}
              </p>
            )}
          </div>
        )
      })}
    </section>
  )
}
