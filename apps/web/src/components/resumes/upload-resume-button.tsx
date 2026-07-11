'use client'

import { ChangeEvent, useRef } from 'react'
import { Loader2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useUploadResume } from '@/hooks/use-resumes'

export function UploadResumeButton() {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadResume = useUploadResume()

  function onSelectResume(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    uploadResume.mutate(formData, {
      onSettled: () => {
        event.target.value = ''
      },
    })
  }

  return (
    <>
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={onSelectResume}
      />
      <Button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploadResume.isPending}
      >
        {uploadResume.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        Upload
      </Button>
    </>
  )
}
