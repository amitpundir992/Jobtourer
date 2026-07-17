const DEFAULT_BUCKET = 'resumes'
const SUPABASE_SCHEME = 'supabase://'
const ALLOWED_RESUME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

let bucketInitialization: Promise<void> | null = null

function storageConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Supabase resume storage requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  return {
    url,
    key,
    bucket: process.env.SUPABASE_RESUME_BUCKET?.trim() || DEFAULT_BUCKET,
  }
}

function encodeObjectPath(objectPath: string) {
  return objectPath
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/')
}

function storageRequestUrl(objectPath: string) {
  const { url, bucket } = storageConfig()
  return `${url}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeObjectPath(objectPath)}`
}

function storageHeaders(contentType?: string) {
  const { key } = storageConfig()
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...(contentType ? { 'Content-Type': contentType } : {}),
  }
}

async function storageError(response: Response, operation: string) {
  const detail = await response.text().catch(() => '')
  throw new Error(
    `Supabase could not ${operation} the resume (${response.status})${detail ? `: ${detail}` : ''}`
  )
}

async function initializeBucket() {
  const { url, bucket } = storageConfig()
  const existing = await fetch(
    `${url}/storage/v1/bucket/${encodeURIComponent(bucket)}`,
    {
      headers: storageHeaders(),
      cache: 'no-store',
    }
  )
  if (existing.ok) return
  if (existing.status !== 404) {
    await storageError(existing, 'check')
  }

  const created = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      ...storageHeaders('application/json'),
    },
    body: JSON.stringify({
      id: bucket,
      name: bucket,
      public: false,
      file_size_limit: 10 * 1024 * 1024,
      allowed_mime_types: ALLOWED_RESUME_TYPES,
    }),
    cache: 'no-store',
  })
  if (!created.ok && created.status !== 409) {
    await storageError(created, 'create the private bucket for')
  }
}

async function ensureResumeBucket() {
  bucketInitialization ??= initializeBucket().catch((error) => {
    bucketInitialization = null
    throw error
  })
  await bucketInitialization
}

export function resumeStorageLocation(objectPath: string) {
  const { bucket } = storageConfig()
  return `${SUPABASE_SCHEME}${bucket}/${objectPath}`
}

export function resumeObjectPath(location: string) {
  if (!location.startsWith(SUPABASE_SCHEME)) return null

  const storedLocation = location.slice(SUPABASE_SCHEME.length)
  const separator = storedLocation.indexOf('/')
  if (separator < 1) return null

  const bucket = storedLocation.slice(0, separator)
  const objectPath = storedLocation.slice(separator + 1)
  if (!objectPath || bucket !== storageConfig().bucket) return null

  return objectPath
}

export async function uploadResumeObject(input: {
  objectPath: string
  contentType: string
  body: Buffer
}) {
  await ensureResumeBucket()

  const response = await fetch(storageRequestUrl(input.objectPath), {
    method: 'POST',
    headers: {
      ...storageHeaders(input.contentType),
      'x-upsert': 'true',
      'cache-control': '3600',
    },
    body: new Uint8Array(input.body),
    cache: 'no-store',
  })

  if (!response.ok) await storageError(response, 'upload')
  return resumeStorageLocation(input.objectPath)
}

export async function downloadResumeObject(location: string) {
  const objectPath = resumeObjectPath(location)
  if (!objectPath) return null

  const response = await fetch(storageRequestUrl(objectPath), {
    headers: storageHeaders(),
    cache: 'no-store',
  })
  if (!response.ok) await storageError(response, 'download')

  return Buffer.from(await response.arrayBuffer())
}

export async function deleteResumeObject(location: string) {
  const objectPath = resumeObjectPath(location)
  if (!objectPath) return

  const response = await fetch(storageRequestUrl(objectPath), {
    method: 'DELETE',
    headers: storageHeaders(),
    cache: 'no-store',
  })
  if (!response.ok && response.status !== 404) {
    await storageError(response, 'delete')
  }
}
