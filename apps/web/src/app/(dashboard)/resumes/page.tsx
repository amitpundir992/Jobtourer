import { ResumesList } from '@/components/resumes/resumes-list'
import { UploadResumeButton } from '@/components/resumes/upload-resume-button'

export default function ResumesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resumes</h1>
          <p className="text-muted-foreground">
            Manage your resumes for different job types
          </p>
        </div>
        <UploadResumeButton />
      </div>

      <ResumesList />
    </div>
  )
}
