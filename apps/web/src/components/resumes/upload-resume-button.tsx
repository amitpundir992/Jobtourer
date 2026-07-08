import { Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function UploadResumeButton() {
  return (
    <Button type="button">
      <Upload className="mr-2 h-4 w-4" />
      Upload
    </Button>
  )
}
