const resumes = [
  { title: 'Frontend Resume', file: 'frontend-resume.pdf', status: 'Default' },
  {
    title: 'Full Stack Resume',
    file: 'full-stack-resume.pdf',
    status: 'Ready',
  },
]

export function ResumesList() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {resumes.map((resume) => (
        <div key={resume.file} className="rounded-lg border bg-background p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">{resume.title}</h2>
              <p className="text-sm text-muted-foreground">{resume.file}</p>
            </div>
            <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
              {resume.status}
            </span>
          </div>
        </div>
      ))}
    </section>
  )
}
